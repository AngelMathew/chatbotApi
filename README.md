
## Building a Custom Q&A Chatbot with Supabase and OpenAI Model 

> [Supabase](https://supabase.com/) - an open-source database infrastructure built on PostgreSQL.
>
> [OpenAI Models](https://platform.openai.com/docs/models) - models used here are `gpt-4` and `text-embedding-ada-002`
<br>

A Supabase and OpenAI system is built, that allows to call an API endpoint with a question, and then generate an answer based on the custom data provided. This is done by using PostgreSQL vector storage, Supabase Edge functions, and OpenAI Embeddings. A supabase and OpenAI account is required.


### Create a .txt file with custom data

Data about a fake person named Anitha is stored in .txt file, it's then turned into an embedding using the model  `text-embedding-ada-002`.Embeddings are stored in supabase vector .


| id  | content                                  |embedding                    |
| :---| :------                                  | :----                       |
| 1   |Anitha grew up in a small town in Kerala. | [0.019696854, 0.00064515544, 2.64515544] |
| 2   |After excelling in math and science classes in high school. | [0.0019600854, 0.01064515544, 0.64515544] |


### Define an API endpoint in Node.JS to get the question from the user
A post endpoint is defined to receive questions in the request body. The questions are then converted into embeddings.
<br>

### Create an edge function in supabase and use the match_documents function
`match_documents` return an array of matching documents to the question. Then, loop through the array of documents and format them for the chatbot prompt. The` get-4` model is used.

```
  const completionResponse = await openai.chat.completions.create({
    messages:[{
        role: "system",
        content: `You are a happy and helpful assistant named Poppy. Who answers questions based on the context sections
        ${matching_documents_array}`,
      },
    { role: "user", content: "<question from user>? },],
     model: "gpt-4",
    })
```
<br>
<br>

### Finally, return the response from the model to the user through a response
<img width="899" alt="Screenshot 2024-06-03 at 6 11 55 PM" src="https://github.com/AngelMathew/chatbotApi/assets/30999892/a499ec5a-0b00-47a9-8bc3-2ae78df6c0cf">

### Install Dependencies
`npm i supabase --save-dev`

### Connect to supabase

```
npx supabase init
npx supabase login
npx supabase link --project-ref <subase url>
```
### Deploy the endpoint
`npx supabase functions deploy ask-custom-data`

### Development Server
`node server.js`
