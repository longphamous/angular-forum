import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";

import { API_CONFIG } from "../../core/config/api.config";
import { PaginatedTransactions, Wallet, WalletTransaction } from "../../core/models/wallet/wallet";
import { WalletFacade } from "./wallet-facade";

const BASE = "http://test-api";

const mockWallet: Wallet = {
    id: "wallet-1",
    userId: "user-1",
    balance: 250,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
};

const mockTx: WalletTransaction = {
    id: "tx-1",
    fromUserId: null,
    toUserId: "user-1",
    amount: 50,
    type: "reward",
    description: "Welcome bonus",
    createdAt: "2024-01-01T00:00:00Z"
};

const mockPaginated: PaginatedTransactions = {
    data: [mockTx],
    total: 1,
    page: 1,
    limit: 20
};

describe("WalletFacade", () => {
    let facade: WalletFacade;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                WalletFacade,
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: API_CONFIG, useValue: { baseUrl: BASE } }
            ]
        });

        facade = TestBed.inject(WalletFacade);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it("should be created", () => {
        expect(facade).toBeTruthy();
    });

    // ─── Initial state ─────────────────────────────────────────────────────────

    describe("initial state", () => {
        it("should have wallet as null", () => {
            expect(facade.wallet()).toBeNull();
        });

        it("should have empty transactions array", () => {
            expect(facade.transactions()).toEqual([]);
        });

        it("should have zero totals and no loading", () => {
            expect(facade.transactionsTotal()).toBe(0);
            expect(facade.walletLoading()).toBeFalse();
            expect(facade.transactionsLoading()).toBeFalse();
            expect(facade.transferring()).toBeFalse();
        });
    });

    // ─── loadWallet ───────────────────────────────────────────────────────────

    describe("loadWallet", () => {
        it("should set wallet signal on success", () => {
            facade.loadWallet();

            const req = httpMock.expectOne(`${BASE}/credit/wallet`);
            expect(req.request.method).toBe("GET");
            req.flush(mockWallet);

            expect(facade.wallet()).toEqual(mockWallet);
            expect(facade.walletLoading()).toBeFalse();
        });

        it("should set walletLoading to true during the request", () => {
            facade.loadWallet();

            expect(facade.walletLoading()).toBeTrue();

            httpMock.expectOne(`${BASE}/credit/wallet`).flush(mockWallet);
        });

        it("should set walletLoading to false on error", () => {
            facade.loadWallet();

            httpMock.expectOne(`${BASE}/credit/wallet`).flush("Error", { status: 500, statusText: "Error" });

            expect(facade.walletLoading()).toBeFalse();
            expect(facade.wallet()).toBeNull();
        });
    });

    // ─── loadTransactions ─────────────────────────────────────────────────────

    describe("loadTransactions", () => {
        it("should set transactions and total on success", () => {
            facade.loadTransactions();

            const req = httpMock.expectOne(`${BASE}/credit/transactions?page=1&limit=20`);
            expect(req.request.method).toBe("GET");
            req.flush(mockPaginated);

            expect(facade.transactions()).toHaveSize(1);
            expect(facade.transactionsTotal()).toBe(1);
            expect(facade.transactionsLoading()).toBeFalse();
        });

        it("should pass custom page and limit as query params", () => {
            facade.loadTransactions(2, 10);

            httpMock.expectOne(`${BASE}/credit/transactions?page=2&limit=10`).flush(mockPaginated);

            expect(facade.transactions()).toHaveSize(1);
            expect(facade.transactionsTotal()).toBe(1);
        });

        it("should set transactionsLoading to false on error", () => {
            facade.loadTransactions();

            httpMock
                .expectOne(`${BASE}/credit/transactions?page=1&limit=20`)
                .flush("Error", { status: 500, statusText: "Error" });

            expect(facade.transactionsLoading()).toBeFalse();
        });
    });

    // ─── transfer ─────────────────────────────────────────────────────────────

    describe("transfer", () => {
        it("should POST transfer data and refresh wallet and transactions on success", () => {
            facade.transfer("user-2", 50, "Gift").subscribe();

            // Transfer request
            const transferReq = httpMock.expectOne(`${BASE}/credit/transfer`);
            expect(transferReq.request.method).toBe("POST");
            expect(transferReq.request.body).toEqual({ toUserId: "user-2", amount: 50, description: "Gift" });
            transferReq.flush(mockTx);

            // Should reload wallet and transactions after success
            httpMock.expectOne(`${BASE}/credit/wallet`).flush(mockWallet);
            httpMock.expectOne(`${BASE}/credit/transactions?page=1&limit=20`).flush(mockPaginated);

            expect(facade.transferring()).toBeFalse();
        });

        it("should set transferring to false on error", () => {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            facade.transfer("user-2", 50).subscribe({ error: () => {} });

            expect(facade.transferring()).toBeTrue();

            httpMock.expectOne(`${BASE}/credit/transfer`).flush("Error", { status: 400, statusText: "Bad Request" });

            expect(facade.transferring()).toBeFalse();
        });

        it("should return an Observable of WalletTransaction", () => {
            let result: WalletTransaction | undefined;

            facade.transfer("user-2", 100, "Payment").subscribe((tx) => {
                result = tx;
            });

            httpMock.expectOne(`${BASE}/credit/transfer`).flush(mockTx);
            httpMock.expectOne(`${BASE}/credit/wallet`).flush(mockWallet);
            httpMock.expectOne(`${BASE}/credit/transactions?page=1&limit=20`).flush(mockPaginated);

            expect(result).toEqual(mockTx);
        });
    });
});
