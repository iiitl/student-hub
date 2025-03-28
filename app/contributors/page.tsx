"use client"
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TypeRepoDetails {
  owner: string;
  repo: string;
}

interface TypeContributors {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

const RepoDetails: TypeRepoDetails = {
  owner: process.env.NEXT_PUBLIC_GITHUB_OWNER || "iiitl",
  repo: process.env.NEXT_PUBLIC_GITHUB_REPO || "student-hub",
  
};

const Contributors = () => {
  const [contributors, setContributors] = useState<TypeContributors[]>([]);
  const [sortBy, setSortBy] = useState<string>("contributions");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (sortBy === "contributions") {
      setContributors((prev) => [...prev].sort((a, b) => b.contributions - a.contributions));
    } else if (sortBy === "name") {
      setContributors((prev) => [...prev].sort((a, b) => a.login.localeCompare(b.login)));
    }
  }, [sortBy]);

  useEffect(() => {
    const fetchContributors = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://api.github.com/repos/${RepoDetails.owner}/${RepoDetails.repo}/contributors`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch contributors");
        }
        const data = await response.json();
        setContributors(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContributors();
  }, []);

  if (error) return (
    <div className="flex min-h-screen w-full justify-center items-center">
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center max-w-md">
        <h2 className="text-xl font-bold text-red-600 mb-2">Unable to load contributors</h2>
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-screen flex-col bg-gradient-to-tr from-[#8900FF] to-[#00A8FF] items-center gap-4 p-4">
      <h1 className="text-3xl font-bold my-4 text-white">Our Contributors</h1>
      <div>
        <p className="text-lg text-white text-center">These are the amazing people who have contributed to this project.</p>
      </div>
      <div className="flex justify-center items-center my-4">
        Sort By:
        <select className="ml-2 p-2 rounded-md bg-white text-black" onChange={(e) => setSortBy(e.target.value)} value={sortBy}>
          <option value="contributions">Contributions</option>
          <option value="name">Name</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-6">
        {contributors.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center w-full py-12">
            <p className="text-xl text-white text-center">No contributors found</p>
          </div>
        )}
        {isLoading && (
          <div className="flex flex-col items-center justify-center w-full py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            <p className="mt-4 text-white">Loading contributors...</p>
          </div>
        )}
        {contributors.length > 0 && (      
          contributors.map((contributor) => (
            <div key={contributor.id}>
              <Card className="flex items-center container w-full sm:w-48 p-6 gap-4 scale-100 hover:scale-105 transition-transform duration-200 bg-white/50 ease-in-out shadow-md">
                <div className="relative">
                  <img
                    src={contributor.avatar_url}
                    alt={contributor.login}
                    className="w-32 h-32 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';
                    }}
                  />
                  <div>
                    <span className="absolute text-sm font-semibold bg-gray-700 bottom-2 right-2 rounded-full w-6 h-6 text-center text-white aspect-square">{contributor.contributions}</span>
                  </div>
                </div>
                <CardContent className="flex flex-col w-full px-0 text-center">
                <p className="text-lg font-semibold font-mono truncate" title={contributor.login}>{contributor.login}</p>
                  <a href={contributor.html_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="default" className="mt-2 cursor-pointer bg-neutral-900 text-white hover:bg-neutral-700 w-full">
                      View Profile
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Contributors;
