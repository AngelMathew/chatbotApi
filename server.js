import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { promises as fsPromises } from "fs";
import express from "express";
import 'dotenv/config'
const app = express();

app.use(express.json());

app.post("/", async (req, res) => {
  const question = req.body.question;
  const data = await askQuestion(question);
  res.send(data);
});
app.listen(3000, () => console.log("Example app listening on port 3000!"));

const supabaseClient = createClient(
  process.env.URL,
  process.env.SUPABASE_API_KEY
);

async function generateEmbeddings() {
  const openai = new OpenAI({
    apiKey: process.env.AI_API_KEY,
  });
  const text = await fsPromises.readFile("./content_document.txt", "utf-8");
  const documents = text.split("\n");
  for (const document of documents) {
    const input = document.replace(/\n/g, "");

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input,
    });
    const embedding = embeddingResponse.data[0].embedding;
    await supabaseClient.from("documents").insert({
      content: document,
      embedding,
    });
  }
}
// generateEmbeddings();
async function askQuestion(question = "no question is provided") {
  const { data, error } = await supabaseClient.functions.invoke(
    "ask-custom-data",
    {
      body: JSON.stringify({ query: question }),
    }
  );
  return data;
}
