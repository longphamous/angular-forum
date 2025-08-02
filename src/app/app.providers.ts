{
  provide: HTTP_INTERCEPTORS,
  useClass: environment.useMocks ? MockInterceptor : RealBackendInterceptor,
  multi: true
}