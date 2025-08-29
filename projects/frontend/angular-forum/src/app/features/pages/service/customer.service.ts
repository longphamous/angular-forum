import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";

export interface Country {
    name?: string;
    code?: string;
}

export interface Representative {
    name?: string;
    image?: string;
}

export interface Customer {
    id?: number;
    name?: string;
    country?: Country;
    company?: string;
    date?: Date;
    status?: string;
    activity?: number;
    representative?: Representative;
    verified?: boolean;
    balance?: number;
}

@Injectable({
    providedIn: "root"
})
export class CustomerService {
    http: HttpClient = inject(HttpClient);

    getData(): Observable<Customer[]> {
        return this.http.get<Customer[]>("assets/data/customers.json");
    }

    getCustomersMini(): Observable<Customer[]> {
        return this.getData().pipe(map((data) => data.slice(0, 5)));
    }

    getCustomersSmall(): Observable<Customer[]> {
        return this.getData().pipe(map((data) => data.slice(0, 10)));
    }

    getCustomersMedium(): Observable<Customer[]> {
        return this.getData().pipe(map((data) => data.slice(0, 50)));
    }

    getCustomersLarge(): Observable<Customer[]> {
        return this.getData().pipe(map((data) => data.slice(0, 200)));
    }

    getCustomersXLarge(): Observable<Customer[]> {
        return this.getData(); // Kein Slice – alles zurückgeben
    }

    getCustomers(params?: Record<string, string | number>): Observable<{ data: Customer[] }> {
        return this.http.get<{ data: Customer[] }>("https://www.primefaces.org/data/customers", { params });
    }
}
