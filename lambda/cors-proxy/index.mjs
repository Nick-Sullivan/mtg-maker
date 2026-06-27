export const handler = async (event) => {
  // Handle OPTIONS for CORS preflight
  if (event.requestContext.http.method === "OPTIONS") {
    return {
      statusCode: 200,
      body: "",
    };
  }

  const targetUrl = event.queryStringParameters?.url;

  if (!targetUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing url parameter" }),
    };
  }

  try {
    const response = await fetch(targetUrl, {
      headers: { "User-Agent": "mtg-maker/1.0" },
    });

    if (!response.ok) {
      console.error(
        `Upstream error fetching ${targetUrl}: ${response.status} ${response.statusText}`,
      );
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: `Upstream returned ${response.status}`,
          url: targetUrl,
        }),
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": response.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
      body: base64,
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error(`Lambda error fetching ${targetUrl}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
