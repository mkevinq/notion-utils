import { Client } from "@notionhq/client";
import {
  InputPropertyValueMap,
  PagesCreateResponse,
  PagesUpdateResponse,
} from "@notionhq/client/build/src/api-endpoints";

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

/**
 * Calls the Notion API to create a new page in a given database.
 *
 * @param {string} database - The ID of the database to create the page in.
 * @param {InputPropertyValueMap} properties - Notion API compliant object containing all properties of the page.
 * @returns {Promise<PagesCreateResponse>} The page creation response from the Notion API.
 */
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

/**
 * Calls the Notion API to update a page in a database.
 *
 * @param {string} page - The ID of the page to update.
 * @param {InputPropertyValueMap} properties - Notion API compliant object containing properties to update.
 * @returns {Promise<PagesUpdateResponse>} The page update response from the Notion API.
 */
export const updateDatabasePage = (
  page: string,
  properties: InputPropertyValueMap
): Promise<PagesUpdateResponse> =>
  notion.pages.update({
    page_id: page,
    properties,
    archived: false,
  });

/**
 * Calls the Notion API to archive a page in a database.
 *
 * @param {string} page - The ID of the page to archive.
 * @returns {Promise<PagesUpdateResponse>} The page update response from the Notion API.
 */
export const deleteDatabasePage = (page: string): Promise<PagesUpdateResponse> =>
  notion.pages.update({
    page_id: page,
    properties: {},
    archived: true,
  });
