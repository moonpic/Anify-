import { load } from "cheerio";
import { extract } from "@extractus/article-extractor";
import MangaProvider from ".";
import { Format } from "../../../types/enums";
import { Chapter, Page, Result } from "../../../types/types";

export default class NovelUpdates extends MangaProvider {
    override rateLimit = 1000;
    override id = "novelupdates";
    override url = "https://www.novelupdates.com";

    public needsProxy: boolean = true;

    override formats: Format[] = [Format.NOVEL];

    override async search(query: string, format?: Format, year?: number, retries = 0): Promise<Result[] | undefined> {
        if (retries >= 5) return undefined;

        const results: Result[] = [];

        const searchData = await this.request(`${this.url}/series-finder/?sf=1&sh=${encodeURIComponent(query)}&nt=2443,26874,2444&ge=280&sort=sread&order=desc`, {
            method: "GET",
            headers: {
                Referer: this.url,
            },
        });

        const data = await searchData.text();

        const $ = load(data);

        const title = $("title").html();
        if (title === "Just a moment..." || title === "Attention Required! | Cloudflare") {
            return this.search(query, format, year, retries + 1);
        }

        $("div.search_main_box_nu").each((_, el) => {
            const img = $(el).find("div.search_img_nu img").attr("src");
            const title = $(el).find("div.search_body_nu div.search_title a").text();
            const id = $(el).find("div.search_body_nu div.search_title a").attr("href")?.split("/series/")[1].split("/")[0];

            results.push({
                id: id!,
                title: title!,
                img: img!,
                altTitles: [],
                format: Format.NOVEL,
                providerId: this.id,
                year: 0,
            });
        });

        return results;
    }

    override async fetchChapters(id: string, retries = 0): Promise<Chapter[] | undefined> {
        if (retries >= 5) return undefined;

        const chapters: Chapter[] = [];

        let data = await (await this.request(`${this.url}/series/${id}`, { headers: { Referer: this.url } })).text();
        let $ = load(data);

        const title = $("title").html();
        if (title === "Page not found - Novel Updates") {
            this.useGoogleTranslate = false;

            data = await (
                await this.request(`${this.url}/series/${id}`, {
                    headers: {
                        Referer: this.url,
                        Origin: this.url,
                    },
                })
            ).text();

            $ = load(data);

            this.useGoogleTranslate = true;
        }
        if (title === "Just a moment..." || title === "Attention Required! | Cloudflare") {
            return this.fetchChapters(id, retries + 1);
        }

        const postId = $("input#mypostid").attr("value");

        this.useGoogleTranslate = false;

        const chapterData = (
            await (
                await this.request(`${this.url}/wp-admin/admin-ajax.php`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        Cookie: "_ga=;",
                        Origin: this.url,
                    },
                    body: `action=nd_getchapters&mypostid=${postId}&mypostid2=0`,
                })
            ).text()
        ).substring(1);

        this.useGoogleTranslate = true;

        const $$ = load(chapterData);

        if (chapterData.includes("not whitelisted by the operator of this proxy") || $$("title").html() === "Just a moment...") return this.fetchChapters(id, retries + 1);

        $$("li.sp_li_chp a[data-id]").each((index, el) => {
            const id = $$(el).attr("data-id");
            const title = $$(el).find("span").text();

            chapters.push({
                id: id!,
                title: title!,
                number: index + 1,
                rating: null,
            });
        });

        return chapters.reverse();
    }

    override async fetchPages(id: string): Promise<Page[] | string | undefined> {
        const data = await (
            await this.request(`${this.url}/extnu/${id}/`, {
                method: "GET",
                headers: {
                    Cookie: "_ga=;",
                },
                redirect: "follow",
            })
        ).text();

        const article = await extract(data);
        return article?.content;
    }
}
