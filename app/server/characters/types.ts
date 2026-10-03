export type CharacterDef = {
  id: string;
  name: string;
  bible: string;
  /** Summary of each completed chapter, keyed by chapter number. */
  storySoFar: Record<number, string>;
  secrets: { id: string; minAffinity: number }[];
  /** In-character line used when the model declines and no fallback answers. */
  refusalLine: string;
};
