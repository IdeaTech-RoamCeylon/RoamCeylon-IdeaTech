// Navigation type definitions for the Admin app

export type AuthStackParamList = {
  Register: undefined;
  Partner: {
    email: string;
    password: string;
    name: string;
    phoneNumber: string;
  };
  EmailVerification: { email: string };
  Login: undefined;
  GoogleSignIn: undefined;
  PasswordReset: undefined;
  LinkSent: { email: string };
  EnterNewPassword: { refreshToken?: string; type?: string } | undefined;
  Home: undefined;
};
