import { HTTP_INTERCEPTORS } from "@angular/common/http";

import { MockInterceptor } from "./core/mocks/mock-interceptor/mock-interceptor";

export const appProviders = [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: MockInterceptor,
    multi: true,
  },
];
