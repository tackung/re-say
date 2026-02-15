/**
 * ファイルストレージ管理
 */
import fs from "fs/promises";
import path from "path";

export interface IFileStorage {
  saveFile(filePath: string, data: Buffer): Promise<void>;
  readFile(filePath: string): Promise<Buffer>;
  deleteFile(filePath: string): Promise<void>;
  ensureDirectory(dirPath: string): Promise<void>;
}

export class FileStorage implements IFileStorage {
  /**
   * ファイルを保存
   */
  async saveFile(filePath: string, data: Buffer): Promise<void> {
    await fs.writeFile(filePath, data);
  }

  /**
   * ファイルを読み込む
   */
  async readFile(filePath: string): Promise<Buffer> {
    return await fs.readFile(filePath);
  }

  /**
   * ファイルを削除
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // ファイルが存在しない場合は無視
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  /**
   * ディレクトリを確実に作成
   */
  async ensureDirectory(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }
}
