import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryFilterProps {
  onCategorySelect: (categoryId: number | null) => void;
  selectedCategoryId: number | null;
}

export function CategoryFilter({ onCategorySelect, selectedCategoryId }: CategoryFilterProps) {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="aspect-video" />
              <CardContent className="p-3">
                <Skeleton className="h-5 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Browse by Category</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {categories?.map((category) => (
          <div 
            key={category.id}
            className={`category-card bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer ${
              selectedCategoryId === category.id ? 'ring-2 ring-primary-500' : ''
            }`}
            onClick={() => onCategorySelect(selectedCategoryId === category.id ? null : category.id)}
          >
            <div 
              className="aspect-w-16 aspect-h-9"
              style={{ background: category.gradientFrom && category.gradientTo 
                ? `linear-gradient(to right, ${category.gradientFrom}, ${category.gradientTo})` 
                : 'linear-gradient(to right, #8b5cf6, #ec4899)' 
              }}
            >
              <div className="flex items-center justify-center h-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {category.iconSvg ? (
                    <g dangerouslySetInnerHTML={{ __html: category.iconSvg }} />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  )}
                </svg>
              </div>
            </div>
            <div className="p-3 text-center">
              <h3 className="category-name font-medium">{category.name}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
