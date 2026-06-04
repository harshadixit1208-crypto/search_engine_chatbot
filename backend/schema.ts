
import { z } from "zod";

 export const AnswerSchema = z.object({
  answer: z.string(),

  followUps: z.array(
    z.string()
  ),

  sources: z.array(
    z.object({
      title: z.string(),
      url: z.string()
    })
  )
});

export type AnswerResponse =
   z.infer<typeof AnswerSchema>;





// import { z } from "zod";

// export const AnswerSchema = z.object({
//   answer: z.string(),

//   followUps: z.array(
//     z.string()
//   )
// });

// export type AnswerResponse =
//   z.infer<typeof AnswerSchema>;