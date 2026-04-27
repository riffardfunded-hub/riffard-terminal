import { updateRScore } from "./service";

export async function onTradeClosed(
  userId: string,
  rScore: number
) {
  return updateRScore(userId, rScore);
}
