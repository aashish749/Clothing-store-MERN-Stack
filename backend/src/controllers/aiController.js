import Groq from "groq-sdk";

/**
 * Helper to structure the prompt for consistent formatting
 */
const getPrompt = ({ name, price, category }) => {
  return `Write a professional e-commerce product description for:
  Product Name: ${name}
  Price: ${price}
  Category: ${category}

  Please follow this structure strictly:
  1. Write 2-3 persuasive sentences about the product.
  2. Add a line that says "**Key Features:**" (use double asterisks for bold).
  3. Provide 3 short, high-impact bullet points.
  4. Use the "•" symbol for each bullet point (not stars or dashes).

  Important: Do not use hashtags (#) or any other markdown except for the bold heading.`;
};

/**
 * Controller to generate product descriptions using Groq
 */
export const generateProductDescription = async (req, res) => {
  try {
    const { name, price, category } = req.body;

    // 1. Validate Input
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Product name is required to generate a description.",
      });
    }

    // 2. Initialize Groq with your existing Env Variable
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "AI API Key is missing in the server configuration.",
      });
    }

    const groq = new Groq({ apiKey });

    // 3. Call the AI Model
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are an expert e-commerce copywriter. You write in plain text but use **bold** for headings. You always use '•' for lists and never use hashtags or asterisks as bullet points.",
        },
        {
          role: "user",
          content: getPrompt({ name, price, category }),
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.4, // Low temperature keeps the formatting consistent
      max_tokens: 500,
    });

    // 4. Extract and Clean Response
    const responseText = chatCompletion.choices[0]?.message?.content || "";

    return res.status(200).json({
      success: true,
      description: responseText.trim(),
    });
  } catch (error) {
    console.error("AI Generation Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate AI description",
    });
  }
};
