/**
 * 相似度计算：标题相似度、模糊匹配、重复检测、多维度综合评分
 * 基于 Levenshtein、Jaccard、Cosine 算法实现工业级去重
 */

export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  const lenA = a.length;
  const lenB = b.length;
  
  for (let i = 0; i <= lenB; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= lenA; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= lenB; i++) {
    for (let j = 1; j <= lenA; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[lenB][lenA];
}

export function similarityScore(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const setB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  
  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;
  
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  
  return intersection.size / union.size;
}

export function cosineSimilarity(a: string, b: string): number {
  const wordsA = a.toLowerCase().split(/\s+/).filter(Boolean);
  const wordsB = b.toLowerCase().split(/\s+/).filter(Boolean);
  
  const freqA: Record<string, number> = {};
  const freqB: Record<string, number> = {};
  
  wordsA.forEach(w => freqA[w] = (freqA[w] || 0) + 1);
  wordsB.forEach(w => freqB[w] = (freqB[w] || 0) + 1);
  
  const allWords = new Set([...Object.keys(freqA), ...Object.keys(freqB)]);
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (const word of allWords) {
    const countA = freqA[word] || 0;
    const countB = freqB[word] || 0;
    
    dotProduct += countA * countB;
    normA += countA * countA;
    normB += countB * countB;
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function diceCoefficient(a: string, b: string): number {
  const getBigrams = (str: string): Set<string> => {
    const bigrams = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.slice(i, i + 2));
    }
    return bigrams;
  };
  
  const bigramsA = getBigrams(a.toLowerCase());
  const bigramsB = getBigrams(b.toLowerCase());
  
  if (bigramsA.size === 0 && bigramsB.size === 0) return 1.0;
  if (bigramsA.size === 0 || bigramsB.size === 0) return 0.0;
  
  const intersection = new Set([...bigramsA].filter(x => bigramsB.has(x)));
  return (2 * intersection.size) / (bigramsA.size + bigramsB.size);
}

export function isDuplicate(
  titleA: string,
  titleB: string,
  infoHashA: string,
  infoHashB: string,
  threshold: number = 0.85,
  weights: { lev: number; jac: number; cos: number; dice: number } = { lev: 0.3, jac: 0.25, cos: 0.25, dice: 0.2 }
): boolean {
  // 如果 InfoHash 相同，绝对是重复
  if (infoHashA.toLowerCase() === infoHashB.toLowerCase()) {
    return true;
  }
  
  // 计算多种相似度
  const levSim = similarityScore(titleA, titleB);
  const jacSim = jaccardSimilarity(titleA, titleB);
  const cosSim = cosineSimilarity(titleA, titleB);
  const diceSim = diceCoefficient(titleA, titleB);
  
  // 综合评分
  const combinedScore = 
    levSim * weights.lev + 
    jacSim * weights.jac + 
    cosSim * weights.cos + 
    diceSim * weights.dice;
  
  return combinedScore >= threshold;
}

export function calculateSimilarityMetrics(titleA: string, titleB: string) {
  return {
    levenshtein: similarityScore(titleA, titleB),
    jaccard: jaccardSimilarity(titleA, titleB),
    cosine: cosineSimilarity(titleA, titleB),
    dice: diceCoefficient(titleA, titleB),
    combined: (
      similarityScore(titleA, titleB) * 0.3 +
      jaccardSimilarity(titleA, titleB) * 0.25 +
      cosineSimilarity(titleA, titleB) * 0.25 +
      diceCoefficient(titleA, titleB) * 0.2
    ),
  };
}

export function findDuplicates<T extends { title: string; infoHash: string }>(
  items: T[],
  threshold: number = 0.85
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  
  for (let i = 0; i < items.length; i++) {
    let foundGroup = false;
    
    for (const [groupId, group] of groups.entries()) {
      if (isDuplicate(items[i].title, group[0].title, items[i].infoHash, group[0].infoHash, threshold)) {
        group.push(items[i]);
        foundGroup = true;
        break;
      }
    }
    
    if (!foundGroup) {
      groups.set(`group_${i}`, [items[i]]);
    }
  }
  
  return groups;
}

export function removeDuplicates<T extends { title: string; infoHash: string }>(
  items: T[],
  threshold: number = 0.85,
  keepStrategy: 'first' | 'best' = 'best'
): T[] {
  const groups = findDuplicates(items, threshold);
  const result: T[] = [];
  
  for (const group of groups.values()) {
    if (group.length === 1) {
      result.push(group[0]);
    } else {
      // 根据策略选择保留项
      if (keepStrategy === 'best') {
        // 简单策略：保留标题最长的（通常信息更全）
        result.push(group.sort((a, b) => b.title.length - a.title.length)[0]);
      } else {
        result.push(group[0]);
      }
    }
  }
  
  return result;
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getDuplicateReport<T extends { title: string; infoHash: string }>(
  items: T[],
  threshold: number = 0.85
): {
  total: number;
  unique: number;
  duplicates: number;
  duplicateGroups: Array<{ size: number; titles: string[] }>;
} {
  const groups = findDuplicates(items, threshold);
  const duplicateGroups = Array.from(groups.values())
    .filter(g => g.length > 1)
    .map(g => ({
      size: g.length,
      titles: g.map(item => item.title),
    }));
  
  return {
    total: items.length,
    unique: groups.size,
    duplicates: items.length - groups.size,
    duplicateGroups,
  };
}
