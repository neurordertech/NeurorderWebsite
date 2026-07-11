import { onRequestGet as __api_news_js_onRequestGet } from "/Users/ntokozo/Desktop/NeurorderWebsite/functions/api/news.js"

export const routes = [
    {
      routePath: "/api/news",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_news_js_onRequestGet],
    },
  ]