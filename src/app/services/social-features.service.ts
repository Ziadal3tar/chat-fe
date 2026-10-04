import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
// import { getAuthToken } from "src/app/core/auth-token.util";

@Injectable({
  providedIn: "root",
})
export class SocialFeaturesService {
  private readonly chatUrl = `${environment.baseUrl}/chat`;
  private readonly planUrl = `${environment.baseUrl}/plans`;

  constructor(private readonly http: HttpClient) {}

  private authOptions() {
    return {
      headers: {
        authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    };
  }

  getStarredMessages(): Observable<any> {
    return this.http.get(`${this.chatUrl}/stars`, this.authOptions());
  }

  starMessage(messageId: string): Observable<any> {
    return this.http.patch(
      `${this.chatUrl}/messages/${messageId}/star`,
      {},
      this.authOptions()
    );
  }

  unstarMessage(messageId: string): Observable<any> {
    return this.http.delete(
      `${this.chatUrl}/messages/${messageId}/star`,
      this.authOptions()
    );
  }


  searchMessages(chatId: string, query: string): Observable<any> {
    return this.http.get(`${this.chatUrl}/search?chatId=${encodeURIComponent(chatId)}&q=${encodeURIComponent(query)}&limit=30`, this.authOptions());
  }

  toggleReaction(messageId: string, emoji: string): Observable<any> {
    return this.http.patch(`${this.chatUrl}/messages/${messageId}/reaction`, { emoji }, this.authOptions());
  }

  toggleMessagePin(messageId: string): Observable<any> {
    return this.http.patch(`${this.chatUrl}/messages/${messageId}/pin`, {}, this.authOptions());
  }

  toggleChatPin(chatId: string): Observable<any> {
    return this.http.patch(`${this.chatUrl}/chats/${chatId}/pin`, {}, this.authOptions());
  }

  toggleChatMute(chatId: string): Observable<any> {
    return this.http.patch(`${this.chatUrl}/chats/${chatId}/mute`, {}, this.authOptions());
  }

  getPinnedMessages(chatId: string): Observable<any> {
    return this.http.get(`${this.chatUrl}/pinned?chatId=${encodeURIComponent(chatId)}`, this.authOptions());
  }

  searchPlanFriends(search: string): Observable<any> {
    const query = encodeURIComponent(search.trim());
    return this.http.get(
      `${this.planUrl}/friends?search=${query}`,
      this.authOptions()
    );
  }

  createPlan(payload: {
    action: "send_reminder" | "reply_reminder" | "scheduled_message";
    target: string;
    scheduledAt: string;
    content?: string;
    recipientId?: string;
  }): Observable<any> {
    return this.http.post(`${this.planUrl}`, payload, this.authOptions());
  }

  getPlans(status?: string): Observable<any> {
    const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
    return this.http.get(`${this.planUrl}${suffix}`, this.authOptions());
  }

  cancelPlan(planId: string): Observable<any> {
    return this.http.delete(`${this.planUrl}/${planId}`, this.authOptions());
  }
}
