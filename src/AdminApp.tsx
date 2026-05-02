
export interface WikiResult {
  title: string;
  extract: string;
  thumbnail?: string;
  pageid: number;
}

export const searchWikipedia = async (query: string): Promise<WikiResult[]> => {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.query || !data.query.search) return [];
  
  return data.query.search.map((item: any) => ({
    title: item.title,
    extract: item.snippet,
    pageid: item.pageid
  }));
};

export const getWikiDetails = async (pageid: number): Promise<WikiResult | null> => {
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro&explaintext&pithumbsize=1000&pageids=${pageid}&format=json&origin=*`;
  const response = await fetch(url);
  const data = await response.json();
  
  const page = data.query.pages[pageid];
  if (!page) return null;
  
  return {
    title: page.title,
    extract: page.extract,
    thumbnail: page.thumbnail?.source,
    pageid: page.pageid
  };
};
