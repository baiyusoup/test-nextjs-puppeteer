// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchHTML } from '@/lib/puppeteer'

type Data = {
  name: string;
  size: number;
  error?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    const html = await fetchHTML(
      'https://manhua.dmzj.com/tags/search.shtml?s=%E9%AD%94%E6%B3%95%E5%B0%91%E5%A5%B3%E5%B0%B1%E6%98%AF%E6%9C%AC%E5%A4%A7%E7%88%B7',
      "div.tcaricature_block2"
    );
    res.status(200).json({ name: 'John Doe', size: html.length })
  } catch (e) {
    console.log(e);
    res.status(200).json({
      error: e,
      name: '',
      size: 0
    });
  }
}
