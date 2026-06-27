import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import { ArrowLeft, Calendar, User, Clock, MapPin, Award, CheckCircle2, Star } from "lucide-react";

interface BlogContentBlock {
  type: "paragraph" | "heading" | "quote" | "list" | "grid";
  text?: string;
  level?: number;
  items?: any[];
}

interface BlogData {
  title: string;
  slug: string;
  description: string;
  metaDescription?: string;
  category: string;
  image: string;
  date: string;
  readTime: string;
  authorName: string;
  authorTitle: string;
  content: BlogContentBlock[];
  cta?: {
    title: string;
    description: string;
    primaryLink: string;
    primaryText: string;
    secondaryLink: string;
    secondaryText: string;
  };
}

function getBlogData(slug: string): BlogData | null {
  try {
    const filePath = path.join(process.cwd(), "public/blogs", `${slug}.json`);
    if (!fs.existsSync(filePath)) return null;
    const fileContent = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(fileContent) as BlogData;
  } catch (error) {
    console.error("Error reading blog file:", error);
    return null;
  }
}

export async function generateStaticParams() {
  const blogsDirectory = path.join(process.cwd(), "public/blogs");
  if (!fs.existsSync(blogsDirectory)) return [];
  const filenames = fs.readdirSync(blogsDirectory);
  return filenames
    .filter((filename) => filename.endsWith(".json"))
    .map((filename) => ({
      slug: filename.replace(".json", ""),
    }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = getBlogData(slug);
  if (!blog) return {};
  return {
    title: blog.title,
    description: blog.metaDescription || blog.description,
  };
}

export default async function DynamicBlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = getBlogData(slug);

  if (!blog) {
    notFound();
  }

  let paragraphIndex = 0;

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link 
          href="/blog" 
          className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Blog
        </Link>

        {/* Article Container */}
        <article className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
          {/* Hero Image */}
          <div className="relative h-64 sm:h-[450px] w-full">
            <Image 
              src={blog.image}
              alt={blog.title}
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-transparent to-transparent"></div>
          </div>

          <div className="p-6 sm:p-12">
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-6">
              <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full">{blog.category}</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {blog.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {blog.readTime}
              </span>
            </div>

            {/* H1 */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-blue-950 tracking-tight leading-tight mb-8">
              {blog.title}
            </h1>

            {/* Author Card */}
            <div className="flex items-center gap-4 border-b border-gray-100 pb-8 mb-8">
              <div className="bg-blue-950 text-white rounded-full p-2.5">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-950">{blog.authorName}</p>
                <p className="text-xs text-gray-500">{blog.authorTitle}</p>
              </div>
            </div>

            {/* Dynamic Content Renderer */}
            <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed space-y-6 text-base sm:text-lg">
              {blog.content.map((block, idx) => {
                switch (block.type) {
                  case "paragraph":
                    paragraphIndex++;
                    if (paragraphIndex === 1) {
                      // Apply Drop Cap style to the first paragraph
                      return (
                        <p key={idx} className="first-letter:text-5xl first-letter:font-black first-letter:text-blue-950 first-letter:float-left first-letter:mr-3 first-letter:leading-none">
                          {block.text}
                        </p>
                      );
                    }
                    return <p key={idx}>{block.text}</p>;

                  case "heading":
                    if (block.level === 3) {
                      return (
                        <h3 key={idx} className="text-xl sm:text-2xl font-bold text-blue-950 tracking-tight mt-10 mb-4">
                          {block.text}
                        </h3>
                      );
                    }
                    return (
                      <h2 key={idx} className="text-2xl sm:text-3xl font-extrabold text-blue-950 tracking-tight mt-12 mb-6">
                        {block.text}
                      </h2>
                    );

                  case "quote":
                    return (
                      <div key={idx} className="bg-blue-50/50 border-l-4 border-blue-900 p-6 rounded-r-2xl my-8">
                        <p className="italic text-blue-950 font-medium">
                          "{block.text}"
                        </p>
                      </div>
                    );

                  case "list":
                    return (
                      <ul key={idx} className="list-disc pl-6 space-y-2">
                        {block.items?.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    );

                  case "grid":
                    return (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-8">
                        {block.items?.map((item, i) => (
                          <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <h4 className="font-bold text-lg text-blue-950 mb-2">{item.title}</h4>
                            <p className="text-gray-600 text-sm sm:text-base">{item.text}</p>
                          </div>
                        ))}
                      </div>
                    );

                  default:
                    return null;
                }
              })}
            </div>

            {/* Dynamic CTA Card */}
            {blog.cta && (
              <div className="mt-16 bg-gradient-to-br from-blue-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-2xl sm:text-3xl font-extrabold mb-4">{blog.cta.title}</h3>
                  <p className="text-blue-100 max-w-xl mx-auto mb-8 font-light text-base sm:text-lg">
                    {blog.cta.description}
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <Link
                      href={blog.cta.primaryLink}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-900/30 uppercase tracking-wider text-sm"
                    >
                      {blog.cta.primaryText}
                    </Link>
                    <Link
                      href={blog.cta.secondaryLink}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 border border-white/20 hover:border-white hover:bg-white/10 text-white font-bold rounded-xl transition-all text-sm uppercase tracking-wider"
                    >
                      {blog.cta.secondaryText}
                    </Link>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600/5 blur-3xl rounded-full"></div>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
