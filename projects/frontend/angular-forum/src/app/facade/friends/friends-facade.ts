import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Observable, tap } from "rxjs";

import { FRIENDS_ROUTES } from "../../core/api/friends.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import { FriendRequest, FriendshipStatusResult, FriendUser, MutualFriend } from "../../core/models/friends/friends";

@Injectable({ providedIn: "root" })
export class FriendsFacade {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    readonly friends = signal<FriendUser[]>([]);
    readonly friendsLoading = signal(false);

    readonly incomingRequests = signal<FriendRequest[]>([]);
    readonly incomingLoading = signal(false);

    readonly outgoingRequests = signal<FriendRequest[]>([]);
    readonly outgoingLoading = signal(false);

    readonly friendCount = signal(0);

    loadFriends(): void {
        this.friendsLoading.set(true);
        this.http.get<FriendUser[]>(`${this.apiConfig.baseUrl}${FRIENDS_ROUTES.list()}`).subscribe({
            next: (friends) => {
                this.friends.set(friends);
                this.friendsLoading.set(false);
            },
            error: () => {
                this.friendsLoading.set(false);
            }
        });
    }

    loadIncomingRequests(): void {
        this.incomingLoading.set(true);
        this.http.get<FriendRequest[]>(`${this.apiConfig.baseUrl}${FRIENDS_ROUTES.incomingRequests()}`).subscribe({
            next: (requests) => {
                this.incomingRequests.set(requests);
                this.incomingLoading.set(false);
            },
            error: () => {
                this.incomingLoading.set(false);
            }
        });
    }

    loadOutgoingRequests(): void {
        this.outgoingLoading.set(true);
        this.http.get<FriendRequest[]>(`${this.apiConfig.baseUrl}${FRIENDS_ROUTES.outgoingRequests()}`).subscribe({
            next: (requests) => {
                this.outgoingRequests.set(requests);
                this.outgoingLoading.set(false);
            },
            error: () => {
                this.outgoingLoading.set(false);
            }
        });
    }

    loadFriendCount(): void {
        this.http.get<{ count: number }>(`${this.apiConfig.baseUrl}${FRIENDS_ROUTES.count()}`).subscribe({
            next: (result) => {
                this.friendCount.set(result.count);
            },
            error: () => undefined
        });
    }

    sendRequest(userId: string): Observable<FriendRequest> {
        return this.http.post<FriendRequest>(`${this.apiConfig.baseUrl}${FRIENDS_ROUTES.sendRequest(userId)}`, {});
    }

    acceptRequest(id: string): Observable<FriendUser> {
        return this.http.post<FriendUser>(`${this.apiConfig.baseUrl}${FRIENDS_ROUTES.accept(id)}`, {}).pipe(
            tap(() => {
                this.loadIncomingRequests();
                this.loadFriends();
                this.loadFriendCount();
            })
        );
    }

    declineRequest(id: string): Observable<void> {
        return this.http.post<void>(`${this.apiConfig.baseUrl}${FRIENDS_ROUTES.decline(id)}`, {}).pipe(
            tap(() => {
                this.loadIncomingRequests();
            })
        );
    }

    cancelRequest(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiConfig.baseUrl}${FRIENDS_ROUTES.remove(id)}`).pipe(
            tap(() => {
                this.loadOutgoingRequests();
            })
        );
    }

    removeFriend(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiConfig.baseUrl}${FRIENDS_ROUTES.remove(id)}`).pipe(
            tap(() => {
                this.loadFriends();
                this.loadFriendCount();
            })
        );
    }

    getFriendshipStatus(userId: string): Observable<FriendshipStatusResult> {
        return this.http.get<FriendshipStatusResult>(`${this.apiConfig.baseUrl}${FRIENDS_ROUTES.status(userId)}`);
    }

    getMutualFriends(userId: string): Observable<MutualFriend[]> {
        return this.http.get<MutualFriend[]>(`${this.apiConfig.baseUrl}${FRIENDS_ROUTES.mutual(userId)}`);
    }
}
