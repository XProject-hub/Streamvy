import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Country } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface CountryFilterProps {
  onCountrySelect: (countryId: number | null) => void;
  selectedCountryId: number | null;
}

export function CountryFilter({ onCountrySelect, selectedCountryId }: CountryFilterProps) {
  const { data: countries, isLoading } = useQuery<Country[]>({
    queryKey: ["/api/countries"],
  });

  if (isLoading) {
    return (
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Filter by Country</h2>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Filter by Country</h2>
      <div className="flex flex-wrap items-center gap-2">
        {selectedCountryId && (
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-primary/10"
            onClick={() => onCountrySelect(null)}
          >
            Clear filter
          </Badge>
        )}
        {countries?.map((country) => (
          <Badge 
            key={country.id}
            variant={selectedCountryId === country.id ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onCountrySelect(selectedCountryId === country.id ? null : country.id)}
          >
            <span className="mr-1">{country.flag}</span> {country.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}