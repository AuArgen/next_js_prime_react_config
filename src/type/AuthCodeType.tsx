export class AuthCodeType {
    auth_code: string;
    expires_in: number;
    success: boolean;

    constructor(
        auth_code: string,
        expires_in: number,
        success: boolean,
    ) {
        this.auth_code = auth_code;
        this.expires_in = expires_in;
        this.success = success;
    }

}