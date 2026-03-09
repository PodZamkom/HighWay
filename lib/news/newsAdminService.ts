import "server-only";

export {
  createNewsPost,
  deleteNewsPost,
  findNewsById,
  listNews,
  patchNewsStatus,
  updateNewsPost,
} from "@/lib/newsRepository";
