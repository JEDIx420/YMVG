import React from "react";
import Link from "next/link";
import Image from "next/image";
import fs from "fs";
import path from "path";
import { Calendar, Clock, ArrowRight, BookOpen } from "lucide-react";

export const metadata = {
  title: "Y's Men SWIR Blog - Insights, Heritage, & Growth",
  description: "Read the latest updates, historical deep-dives, and service impact stories from Y's Men International Kerala (South West India Region).",
};

interface BlogPostSummary {
  title: string;
  slug: string;
  description: string;
  category: string;
  image: string;
  date: string;
  readTime: string;
}

function getAllBlogs(): BlogPostSummary[] {
  try {
    const blogsDirectory = path.join(process.cwd(), "public/blogs");
    if (!fs.existsSync(blogsDirectory)) return [];
    
    const filenames = fs.readdirSync(blogsDirectory);
    const blogs = filenames
      .filter((filename) => filename.endsWith(".json"))
      .map((filename) => {
        const filePath = path.join(blogsDirectory, filename);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(fileContent);
        return {
          title: data.title,
          slug: data.slug,
          description: data.description,
          category: data.category,
          image: data.image,
          date: data.date,
          readTime: data.readTime,
        };
      });

    // Sort by date (newest first, if parseable, otherwise default ordering)
    return blogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("Error reading blog directory:", error);
    return [];
  }
}

export default function BlogIndexPage() {
  const blogPosts = getAllBlogs();

  return (
    <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full text-blue-700 font-semibold text-sm mb-4">
            <BookOpen className="w-4 h-4" />
            Official Publication Hub
          </div>
          <h1 className="text-4xl font-extrabold text-blue-950 sm:text-5xl tracking-tight mb-4">
            Our Stories & Impact
          </h1>
          <p className="text-xl text-gray-600 font-light">
            Stay updated with news, history, and community building updates from Y's Men International - South West India Region.
          </p>
          <div className="w-24 h-1 bg-red-600 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Blog Grid */}
        {blogPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article 
                key={post.slug} 
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col hover:shadow-xl transition-all duration-300 group"
              >
                {/* Image Section */}
                <div className="relative h-56 w-full overflow-hidden">
                  <Image 
                    src={post.image}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-sm text-blue-950 font-bold text-xs px-3 py-1.5 rounded-full shadow-sm">
                      {post.category}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 sm:p-8 flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {post.readTime}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-blue-950 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {post.title}
                    </h2>

                    <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3">
                      {post.description}
                    </p>
                  </div>

                  <div>
                    <Link 
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center text-sm font-bold text-blue-950 group-hover:text-blue-600 transition-colors group-hover:gap-3 gap-2"
                    >
                      Read Full Article
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-gray-500">No blog posts found. Add JSON files to public/blogs/ to see them here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
