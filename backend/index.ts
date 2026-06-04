import express from "express";
import type { Request, Response } from "express";
import OpenAI from "openai";

import { tavily } from "@tavily/core";

import { zodTextFormat } from "openai/helpers/zod";

import {
  SYSTEM_PROMPT,
  PROMPT_TEMPLATE
} from "./prompt";

import {
  AnswerSchema
} from "./schema";

const app = express();

app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const tavilyClient = tavily({
  apiKey: process.env.TAVILY_API_KEY
});

//main ask endpoint
app.post("/ask", async (req: Request, res: Response) => {
  try {
    const query = req.body.query;

    if (!query) {
      return res.status(400).json({
        error: "Query is required"
      });
    }

    // Tavily Search

    const webSearchResponse =
      await tavilyClient.search(query, {
        searchDepth: "advanced"
      });

    const webSearchResults =
      webSearchResponse.results;

    // Build Prompt

    const prompt =
      PROMPT_TEMPLATE
        .replace(
          "{{WEB_SEARCH_RESULTS}}",
          JSON.stringify(
            webSearchResults,
            null,
            2
          )
        )
        .replace(
          "{{USER_QUERY}}",
          query
        );

    // OpenAI Structured Output

    const response =
      await client.responses.parse({
        model: "gpt-4o",

        instructions:
          SYSTEM_PROMPT,

        input: prompt,

        text: {
          format: zodTextFormat(
            AnswerSchema,
            "answer_response"
          )
        }
      });

    const result =
      response.output_parsed;

    return res.json(result);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
});


//app.post("/ask/followup", async => (req: Request, res: Response)
//step 1 get the chat from the db
//step2 pass. the  full history to llm 
//step3 do context engineering
//step4 do stream the response to user


// Export app for testing
export default app;

app.listen(3000, () => {
  console.log(
    "Server running on port 3000"
  );
});