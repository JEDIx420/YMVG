import { Users, HeartHandshake, Star, Globe } from "lucide-react";

export default function PhilosophyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* STEP 1: Mini-Hero Section */}
      <section 
        className="relative min-h-[50vh] flex items-center justify-center bg-cover bg-center"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=2070&auto=format&fit=crop')` 
        }}
      >
        <div className="absolute inset-0 bg-blue-950/80"></div>
        <div className="relative text-center px-4 max-w-7xl mx-auto py-24">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-4 leading-tight">
            Our Philosophy<br />
            <span className="text-blue-400">& Values</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 font-light italic">
            "Guided by fellowship, driven by service."
          </p>
        </div>
      </section>

      {/* STEP 2: Core Mission Section */}
      <section className="bg-white py-24 px-4 overflow-hidden">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-0.5 bg-blue-900 rounded-full"></div>
            <h2 className="text-3xl font-black text-blue-950 tracking-tight uppercase">
              A Partnership with the YMCA
            </h2>
            <div className="w-12 h-0.5 bg-blue-900 rounded-full"></div>
          </div>
          
          <p className="text-xl text-gray-700 leading-relaxed font-light">
            Y's Men International is a worldwide fellowship of persons of all faiths working together in mutual respect and affection, 
            based on the teachings of Jesus Christ, and with a common loyalty to the Young Men's Christian Association (YMCA). 
            We strive through active service to develop, encourage and provide leadership to build a better world for all humankind.
          </p>
          
          <div className="pt-8">
            <div className="inline-block px-6 py-3 border-2 border-red-600/20 rounded-full text-red-600 font-bold text-sm uppercase tracking-widest">
              Est. 1922 • Serving Globally
            </div>
          </div>
        </div>
      </section>

      {/* STEP 3: The Four Pillars Grid */}
      <section className="bg-slate-50 py-24 px-4">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center">
            <h3 className="text-sm font-bold text-red-600 uppercase tracking-[0.3em] mb-4">The Foundation</h3>
            <h2 className="text-4xl font-black text-blue-950 tracking-tight">Our Four Pillars of Engagement</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Fellowship */}
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
                <Users className="w-8 h-8 text-red-600" />
              </div>
              <h4 className="text-xl font-bold text-blue-950 mb-4">Fellowship</h4>
              <p className="text-gray-600 leading-relaxed font-light">
                Building lasting bonds of friendship and mutual support across local and international borders.
              </p>
            </div>

            {/* Service */}
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
                <HeartHandshake className="w-8 h-8 text-red-600" />
              </div>
              <h4 className="text-xl font-bold text-blue-950 mb-4">Service</h4>
              <p className="text-gray-600 leading-relaxed font-light">
                Acknowledging the duty that accompanies every right through dedicated community action.
              </p>
            </div>

            {/* Leadership */}
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
                <Star className="w-8 h-8 text-red-600" />
              </div>
              <h4 className="text-xl font-bold text-blue-950 mb-4">Leadership</h4>
              <p className="text-gray-600 leading-relaxed font-light">
                Developing and encouraging leaders to spearhead positive change in our communities.
              </p>
            </div>

            {/* International Understanding */}
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
                <Globe className="w-8 h-8 text-red-600" />
              </div>
              <h4 className="text-xl font-bold text-blue-950 mb-4">International</h4>
              <p className="text-gray-600 leading-relaxed font-light">
                Fostering global citizenship, cultural exchange, and worldwide peace and understanding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STEP 4: The Motto Banner */}
      <section className="bg-blue-950 text-white py-24 text-center px-4 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-900/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-900/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
        
        <div className="relative max-w-4xl mx-auto space-y-6">
          <p className="text-blue-400 font-bold uppercase tracking-[0.2em] text-sm">Our Official Motto</p>
          <div className="h-0.5 w-16 bg-red-600 mx-auto"></div>
          <blockquote className="text-3xl md:text-5xl font-extralight italic leading-tight px-4">
            "To acknowledge the duty that accompanies every right."
          </blockquote>
        </div>
      </section>
    </div>
  );
}
