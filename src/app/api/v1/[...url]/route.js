'use server';
// src/app/api/[...url]/route.js
import axios from 'axios';
import {NextResponse} from 'next/server';
import {cookies} from 'next/headers'; // !!! МААНИЛҮҮ: Server Components/API Routes'те кукилерди окуу үчүн

// Бэкендиңиздин базалык URL'и
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
// Refresh Token эндпоинтинин URL'и
// Авторизация header'ин кошуу керексиз болгон жолдордун тизмеси
const NO_AUTH_PATHS = [
    '/v1/authorization/end',
    '/refresh/token', // Сиздин URL'иңиз боюнча тууралаңыз
    // Башка публичный эндпоинттер, мисалы, /v1/public/products ж.б.
];

// Бардык HTTP методдорун иштете турган жалпы прокси функциясы
async function handleProxyRequest(request) {
    // 1. request.url'дан толук URL'ди алабыз
    const fullRequestUrl = request.url;

    // 2. Next.js API роутунун базалык URL'ин алып салуу
    const urlObject = new URL(fullRequestUrl);
    const backendRelativePathWithQuery = urlObject.pathname.replace('/api/v1/', '') + urlObject.search;

    // 3. Бэкендге жөнөтүлө турган толук URL'ди курабыз
    const targetBackendUrl = `${BACKEND_BASE_URL}/${backendRelativePathWithQuery}`;

    const method = request.method.toLowerCase();
    let requestBody = null;
    if (request.body && request.headers.get('content-type')?.includes('application/json')) {
        try {
            requestBody = await request.json();
        } catch (e) {
            console.warn('Request body JSON эмес же окууда ката:', e);
        }
    }

    // Башталгыч жооп объектин түзүү. Бул объектке кукилерди *орнотушубуз* керек.
    // Кукилерди *окуу* үчүн `cookies()` функциясын колдонобуз.
    let proxyResponse = NextResponse.json({message: 'Initializing proxy response'}, {status: 200});

    async function makeRequestWithAuth(token) {
        const requestConfig = {
            method: method,
            url: targetBackendUrl,
            headers: {
                // Бардык келген хедерлерди өткөрүү
                ...Object.fromEntries(request.headers.entries()),
            },
            data: requestBody,
        };

        // Ашыкча хедерлерди тазалоо (Next.js'тин ички хедерлери)
        delete requestConfig.headers.host;
        delete requestConfig.headers.connection;
        delete requestConfig.headers['content-length'];
        delete requestConfig.headers['accept-encoding'];
        delete requestConfig.headers['user-agent'];

        // Axios'тун `Content-Type`'ын туура коюу, эгерде body бар болсо
        if (requestBody && !requestConfig.headers['Content-Type']) {
            requestConfig.headers['Content-Type'] = 'application/json';
        }

        // Эгерде access token берилсе жана бул эндпоинт авторизацияны талап кылса, Authorization header'ин кошуу
        const isAuthRequired = !NO_AUTH_PATHS.some(path => backendRelativePathWithQuery.startsWith(path));
        if (token && isAuthRequired) {
            requestConfig.headers.Authorization = `Bearer ${token}`;
        } else if (!isAuthRequired) {
            // Эгер авторизация талап кылынбаса, Authorization header'ин алып салуу
            delete requestConfig.headers.Authorization;
        }

        return axios(requestConfig);
    }

    // !!! Оңдоо: Кукилерди `next/headers` модулундагы `cookies()` функциясы аркылуу окуу
    const requestCookies = await cookies(); // cookies() бул жерде бир жолу чакырылды
    let accessToken = requestCookies.get('access_token')?.value;
    let refreshToken = requestCookies.get('refresh_token')?.value;

    try {


        // console.log('all cookies', requestCookies.getAll());
        console.log(`Initial access_token from request: ${accessToken}`);
        console.log(`Initial refresh_token from request: ${refreshToken}`);

        // 1. Биринчи аракет: Учурдагы access token менен сурамды жөнөтүү
        const backendResponse = await makeRequestWithAuth(accessToken);
        // Жооптун статус кодун жана мазмунун орнотуу
        proxyResponse = new NextResponse(JSON.stringify(backendResponse.data), {
            status: backendResponse.status,
            headers: {
                'Content-Type': 'application/json',
                // Бэкендден келген Set-Cookie сыяктуу хедерлерди да өткөрүп берүү маанилүү
                // Бул жерде Set-Cookie header'ин гана көчүрүү туура болот,
                // анткени башка хедерлерди Next.js автоматтык түрдө башкарат.
                ...(backendResponse.headers['set-cookie'] ? {'Set-Cookie': backendResponse.headers['set-cookie']} : {}),
            },
        });

        return proxyResponse;

    } catch (error) {
        // Эгерде ката AxiosError болсо жана 401 Unauthorized статусу менен келсе
        if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
            console.log("Access token жараксыз же мөөнөтү бүттү. Refresh token колдонулууда...");

            if (refreshToken) {
                try {
                    // 2. Refresh token аркылуу жаңы access token алуу
                    const refreshRes = await axios.create({
                        baseURL: BACKEND_BASE_URL,
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json', // !!! Бул сапты кошуп көрүңүз
                        },
                    }).post('/refresh/token', {
                        refresh_token: refreshToken,
                    });

                    if (refreshRes.status === 401) {
                        proxyResponse.cookies.delete('refresh_token');

                    }

                    const {access_token, refresh_token, expires_at} = refreshRes.data; // newRefreshToken деп атадык, чаташпоо үчүн

                    if (access_token && refresh_token && expires_at) { // newRefreshToken да текшерүү
                        console.log("Access token ийгиликтүү жаңыртылды. Кукиге сакталууда...");

                        if (requestCookies.has('refresh_token')) {
                            console.log('deleted refresh_token')
                            requestCookies.delete('refresh_token');
                        }
                        if (requestCookies.has('access_token')) {
                            console.log('deleted access_token')
                            requestCookies.delete('access_token');
                        }
                        console.log('expires_at', expires_at);
                        // Установка HttpOnly cookies
                        requestCookies.set("access_token", access_token, {
                            httpOnly: true,
                            secure: process.env.NEXT_PUBLIC_NODE_ENV === 'production', // Өндүрүштө гана secure
                            sameSite: "lax",
                            path: "/",
                            expires: new Date(Date.now() + expires_at * 1000), // API'ден келген мөөнөтү
                        });

                        requestCookies.set("refresh_token", refresh_token, {
                            httpOnly: true,
                            secure: process.env.NEXT_PUBLIC_NODE_ENV === 'production',
                            sameSite: "lax",
                            path: "/",
                            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 күн
                        });


                        // !!! МААНИЛҮҮ ӨЗГӨРТҮҮ: Кукилерди proxyResponse'го сактоо !!!
                        // proxyResponse.cookies.set('access_token', access_token, {
                        //     httpOnly: true,
                        //     secure: process.env.NEXT_PUBLIC_NODE_ENV === 'production',
                        //     sameSite: 'lax',
                        //     path: '/',
                        //     expires: new Date(expires_at),
                        // });
                        //
                        // proxyResponse.cookies.set("refresh_token", newRefreshToken, { // Жаңы refresh token'ди да сакта
                        //     httpOnly: true,
                        //     secure: process.env.NEXT_PUBLIC_NODE_ENV === 'production',
                        //     sameSite: "lax",
                        //     path: "/",
                        //     expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 күн
                        // });

                        console.log("Оригиналдуу сурамды жаңы access token менен кайталоо.");

                        // 3. Оригиналдуу сурамды жаңы access token менен кайталоо
                        const retryBackendResponse = await makeRequestWithAuth(access_token);

                        proxyResponse = new NextResponse(JSON.stringify(retryBackendResponse.data), {
                            status: retryBackendResponse.status,
                            headers: {
                                'Content-Type': 'application/json',
                                // Retry жооптон Set-Cookie хедерин да өткөрүп берүү
                                // ЭСКЕРТҮҮ: Бул жерде Set-Cookie'ни кайра орнотпойбуз,
                                // анткени биз буга чейин proxyResponse.cookies.set() аркылуу койгонбуз.
                                // Эгер бэкендден да Set-Cookie келсе, аны бул жерге кошуу керек.
                                // Бирок адатта, токен жаңыртуу логикасы кукилерди өзү башкарат.
                                ...(retryBackendResponse.headers['set-cookie'] ? {'Set-Cookie': retryBackendResponse.headers['set-cookie']} : {}),
                            },
                        });
                        return proxyResponse;
                    }
                } catch (refreshError) {
                    console.error("Токенди жаңыртууда ката кетти:", refreshError);
                    // Refresh token да жараксыз болсо же башка ката болсо, кукилерди тазалоо
                    // requestCookies.delete() эмес, proxyResponse.cookies.delete() колдонуу керек,
                    // анткени cookies() бул окуу үчүн, delete() үчүн response керек.
                    proxyResponse.cookies.delete('refresh_token');
                    proxyResponse.cookies.delete('access_token');
                    // Логин барагына багыттоо үчүн клиентке белги берүү
                    proxyResponse = new NextResponse(JSON.stringify({message: "Сессияңыздын мөөнөтү бүттү, кайра кириңиз."}), {
                        status: 401,
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Redirect-To': '/', // Клиент тараптан багыттоо үчүн колдонулат
                        }
                    });
                    return proxyResponse;
                }
            } else {
                console.log("Refresh token жок. Колдонуучу чыгуу.");
                // Refresh token жок болсо, жөн гана кукилерди тазалоо
                // proxyResponse.cookies.delete('access_token', {path: '/'});
                requestCookies.delete('access_token');
                // requestCookies.delete('refresh_token', {path: '/'});
                proxyResponse = new NextResponse(JSON.stringify({message: "Сессияңыздын мөөнөтү бүттү, кайра кириңиз."}), {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Redirect-To': '/',
                    }
                });
                return proxyResponse;
            }
        }

        // Жалпы каталарды иштетүү (401 эмес, же AxiosError эмес)
        if (axios.isAxiosError(error) && error.response) {
            console.error('Бэкендден жооп катасы:', error.response.status, error.response.data);
            proxyResponse = new NextResponse(JSON.stringify(error.response.data), {
                status: error.response.status,
                headers: {'Content-Type': 'application/json'}
            });
            return proxyResponse;
        } else if (axios.isAxiosError(error) && error.request) {
            console.error('Бэкендге жетүү мүмкүн эмес же тармак катасы:', error.message);
            proxyResponse = new NextResponse(JSON.stringify({message: 'Бэкенд серверине жетүү мүмкүн эмес'}), {
                status: 500,
                headers: {'Content-Type': 'application/json'}
            });
            return proxyResponse;
        } else {
            console.error('Next.js API проксисиндеги ички ката:', error);
            proxyResponse = new NextResponse(JSON.stringify({message: 'Ички сервер катасы'}), {
                status: 500,
                headers: {'Content-Type': 'application/json'}
            });
            return proxyResponse;
        }
    }
}

export async function GET(request) {
    return handleProxyRequest(request);
}

export async function POST(request) {
    return handleProxyRequest(request);
}

export async function PUT(request) {
    return handleProxyRequest(request);
}

export async function DELETE(request) {
    return handleProxyRequest(request);
}

export async function PATCH(request) {
    return handleProxyRequest(request);
}

export async function HEAD(request) {
    return handleProxyRequest(request);
}

export async function OPTIONS(request) {
    return handleProxyRequest(request);
}