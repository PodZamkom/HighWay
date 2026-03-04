export interface MediaAsset {
  id: string;
  bucket: string;
  key: string;
  url: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  originalName: string;
  uploader: string | null;
  createdAt: string;
}
