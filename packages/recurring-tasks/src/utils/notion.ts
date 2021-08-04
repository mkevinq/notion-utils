import { Client } from "@notionhq/client";
import {
  InputPropertyValueMap,
  PagesUpdateResponse,
  PagesCreateResponse,
} from "@notionhq/client/build/src/api-endpoints";

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export const createDatabasePage = (
  database: string,
  properties: InputPropertyValueMap
): Promise<PagesCreateResponse> =>
  notion.pages.create({
    parent: {
      database_id: database,
    },
    properties,
  });

export const updateDatabasePage = (
  page: string,
  properties: InputPropertyValueMap
): Promise<PagesUpdateResponse> =>
  notion.pages.update({
    page_id: page,
    properties,
    archived: false,
  });

export const deleteDatabasePage = (page: string): Promise<PagesUpdateResponse> =>
  notion.pages.update({
    page_id: page,
    properties: {},
    archived: true,
  });
