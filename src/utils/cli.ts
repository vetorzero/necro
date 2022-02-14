import inquirer from "inquirer";

export async function singlePrompt(question: inquirer.DistinctQuestion) {
  const { answer } = await inquirer.prompt({
    ...question,
    name: "answer",
  });

  return answer;
}
