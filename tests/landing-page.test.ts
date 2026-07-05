import { describe,expect,it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const html=readFileSync(resolve(process.cwd(),"index.html"),"utf8");
describe("product landing page",()=>{
    it("covers the complete end-user product story",()=>{for(const text of ["Describe the dashboard","AI-ready prompts","Power BI interactions","Safe calculation DSL","Leaflet maps","Global styling","Core package","Maps package"])expect(html).toContain(text);});
    it("is GitHub Pages-ready without CDN dependencies",()=>{expect(html).toContain("<!doctype html>");expect(html).not.toMatch(/<script[^>]+src=/i);expect(html).not.toMatch(/<link[^>]+stylesheet/i);});
    it("provides accessible navigation and interactive product views",()=>{expect(html).toContain('aria-label="Main navigation"');expect(html).toContain('data-screen="studio"');expect(html).toContain('data-screen="dashboard"');expect(html).toContain('aria-expanded="false"');});
});
