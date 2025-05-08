import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { searchAirports, Airport } from "@/data/airports";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface AirportInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function AirportInput({
  value,
  onChange,
  placeholder = "Enter airport code or name",
  className,
}: AirportInputProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [airports, setAirports] = useState<Airport[]>([]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (inputValue.length > 1) {
      const results = searchAirports(inputValue);
      setAirports(results);
    } else {
      setAirports([]);
    }
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleSelectAirport = (airport: Airport) => {
    // Set the value to the format "CODE - Airport Name"
    const formattedValue = `${airport.code} - ${airport.name}`;
    setInputValue(formattedValue);
    onChange(formattedValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={cn(
              "w-full pr-10",
              className
            )}
            onFocus={() => inputValue.length > 1 && setOpen(true)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
            onClick={() => setOpen(!open)}
          >
            <ChevronsUpDown className="h-4 w-4" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start" side="bottom" sideOffset={5}>
        <Command className="w-full">
          <CommandList>
            <CommandInput 
              placeholder="Search airports..." 
              value={inputValue}
              onValueChange={(value) => {
                setInputValue(value);
                onChange(value);
              }}
            />
            <CommandEmpty>No airports found.</CommandEmpty>
            {airports.length > 0 && (
              <CommandGroup heading="Airports">
                {airports.map((airport) => (
                  <CommandItem
                    key={airport.code}
                    value={airport.code}
                    onSelect={() => handleSelectAirport(airport)}
                  >
                    <div className="flex items-center">
                      <span className="font-medium">{airport.code}</span>
                      <span className="ml-2 text-muted-foreground">-</span>
                      <span className="ml-2 truncate">{airport.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {airport.city}, {airport.country}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}