import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/dashboard/",
        "/auth",
        "/auth/",
        "/unauthorized",
        "/login",
        "/actions",
        "/actions/",
      ],
    },
    sitemap: "https://ysmenswir-v.com/sitemap.xml",
  };
}
