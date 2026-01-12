/**
 * Slack Webhook 알림 유틸리티
 */

interface SlackNotificationPayload {
  title: string;
  userName: string;
  userEmail: string;
  fileCount: number;
  requestId: string;
  memo?: string;
}

/**
 * 새 분석 요청 생성 시 Slack 알림 전송
 */
export async function sendNewRequestNotification(
  payload: SlackNotificationPayload
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("SLACK_WEBHOOK_URL is not configured. Skipping notification.");
    return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://remo-data-bridge.remo.re.kr";
  const requestUrl = `${baseUrl}/requests/${payload.requestId}`;

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "📥 새 분석 요청이 등록되었습니다",
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*제목:*\n${payload.title}`,
        },
        {
          type: "mrkdwn",
          text: `*요청자:*\n${payload.userName} (${payload.userEmail})`,
        },
      ],
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*파일 수:*\n${payload.fileCount}개`,
        },
        {
          type: "mrkdwn",
          text: `*요청 ID:*\n${payload.requestId}`,
        },
      ],
    },
  ];

  // 메모가 있으면 추가
  if (payload.memo) {
    blocks.push({
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*메모:*\n${payload.memo.substring(0, 200)}${payload.memo.length > 200 ? "..." : ""}`,
        },
      ],
    });
  }

  // 링크 버튼 추가
  blocks.push({
    type: "actions",
    // @ts-expect-error Slack Block Kit elements type
    elements: [
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "요청 상세 보기",
          emoji: true,
        },
        url: requestUrl,
        action_id: "view_request",
        style: "primary",
      },
    ],
  });

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ blocks }),
    });

    if (!response.ok) {
      console.error(
        "Slack notification failed:",
        response.status,
        await response.text()
      );
    }
  } catch (error) {
    console.error("Failed to send Slack notification:", error);
    // 알림 실패가 메인 기능에 영향을 주지 않도록 에러를 throw하지 않음
  }
}
