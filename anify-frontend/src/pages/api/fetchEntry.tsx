/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type ServerResponse } from "http";
import { env } from "~/env.mjs";

export default async function handler(request: Request, response: ServerResponse) {
    if (!request.body.provider) {
        response.writeHead(400, { "Content-Type": "application/json" });
        response.write(JSON.stringify({ message: "Missing provider." }));
        response.end();
        return;
    }
    if (!request.body.userId) {
        response.writeHead(400, { "Content-Type": "application/json" });
        response.write(JSON.stringify({ message: "Missing user ID." }));
        response.end();
        return;
    }
    if (!request.body.accessToken) {
        response.writeHead(400, { "Content-Type": "application/json" });
        response.write(JSON.stringify({ message: "Missing access token." }));
        response.end();
        return;
    }
    if (!request.body.mediaId) {
        response.writeHead(400, { "Content-Type": "application/json" });
        response.write(JSON.stringify({ message: "Missing media ID." }));
        response.end();
        return;
    }

    try {
        const data = await (
            await fetch(`${env.AUTH_URL}/${request.body.provider}/entry`, {
                method: "POST",
                body: JSON.stringify({
                    userId: request.body.userId,
                    accessToken: request.body.accessToken,
                    mediaId: request.body.mediaId,
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            })
        ).json();

        response.writeHead(200, { "Content-Type": "application/json" });
        response.write(JSON.stringify(data));
        response.end();
        return;
    } catch (e) {
        response.writeHead(500, { "Content-Type": "application/json" });
        response.write(JSON.stringify({ message: "Internal server error." }));
        response.end();
        return;
    }
}

interface Request {
    body: {
        provider: string;
        userId: string;
        accessToken: string;
        mediaId: string;
    };
}
