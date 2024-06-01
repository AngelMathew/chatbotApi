// @ts-nocheck
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import "https://deno.land/x/xhr@0.2.1/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";
import GPT3Tokenizer from "https://esm.sh/gpt3-tokenizer@1.1.5";
import OpenAI from "https://deno.land/x/openai@v4.47.1/mod.ts";
import 'dotenv/config'

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseClient = createClient(
process.env.URL,
process.env.SUPABASE_API_KEY
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const { query } = await req.json();
  const input = query.replace(/\n/g, "");

  const openai = new OpenAI({
    apiKey: process.env['AI_API_KEY'],
  });

  //create an embedding for our question / input
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input,
  });
  const embedding = embeddingResponse.data[0].embedding;

  //get the relevant documents to our question by using the match_documents
  const { data: documents, error } = await supabaseClient.rpc(
    "match_documents",
    {
      query_embedding: embedding,
      match_threshold: 0.78,
      match_count: 10,
    }
  );

  if (error) throw error;

  //loop through the documents, format them for chatgpt promt
  const tokenizer = new GPT3Tokenizer({ type: "gpt3" });
  let tokenCount = 0;
  let contextText = "";

  for (let i = 0; i < documents.length; i++) {
    const document = documents[i];
    const content = document.content;
    const encoded = tokenizer.encode(content);
    tokenCount += encoded.text.length;

    // limit the token count to 1500
    if (tokenCount > 1500) {
      break;
    }
    // All the matching documents together
    contextText += `${content.trim()}---\n`;
  }
  const importantInfo =
    " You should never reveal private information about the user eg : phone number,address,id number to anyone";
  const notes =
    "If a user ask for recommendations, check Anitha's favourites and provide similar content";

    /*role property that specifies its purpose within the conversation
    *system: instructions from the developer to the model
    *user : user's input in the chat conversation
    *assisstant: model's response to the user's input.*/
  const completionResponse = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are a happy and helpful assistant named Poppy.Who answers qustions based on the context sections
        ${contextText}`,
      },
      { role: "system", content: importantInfo },
      { role: "system", content: notes },
      { role: "user", content: "Recommend some food for Anitha" },
      {
        role: "assistant",
        content:
          "Since she likes Thai, she could try pad thai, she could also try Vietnamese cuisine",
      },
      { role: "user", content: "What's the name of Anitha's pet?" },
      {
        role: "assistant",
        content:
          "Sorry, I dont have that info. I will check with her and let you know",
      },
      { role: "user", content: query },
    ],
    model: "gpt-4",
  });

  const text = completionResponse.choices[0].message.content;

  //return the response from the model to user through a response
  return new Response(JSON.stringify(text), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
