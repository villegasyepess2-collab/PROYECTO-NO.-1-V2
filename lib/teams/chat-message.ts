export async function sendTeamsChatMessage(params: { chatId: string; htmlBody: string }): Promise<{ messageId: string }> {
  const token = process.env.MS_GRAPH_TOKEN;
  if (!token) throw new Error("MS_GRAPH_TOKEN is required for Teams chatMessage notifications");

  const response = await fetch(`https://graph.microsoft.com/v1.0/chats/${params.chatId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      body: {
        contentType: "html",
        content: params.htmlBody
      }
    })
  });

  if (!response.ok) {
    throw new Error(`chatMessage send failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { id: string };
  return { messageId: payload.id };
}
