import { describe,expect,it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const html=readFileSync(resolve(process.cwd(),"index.html"),"utf8");
const visualLanding=readFileSync(resolve(process.cwd(),"src/editor/LandingPage.tsx"),"utf8");
const setupExperience=readFileSync(resolve(process.cwd(),"src/editor/SetupExperience.tsx"),"utf8");
describe("product landing page",()=>{
    it("covers the complete end-user product story",()=>{for(const text of ["Describe the dashboard","AI-ready prompts","Power BI interactions","Safe calculation DSL","Leaflet maps","Global styling","Core package","Maps package"])expect(html).toContain(text);});
    it("is GitHub Pages-ready without CDN dependencies",()=>{expect(html).toContain("<!doctype html>");expect(html).not.toMatch(/<script[^>]+src=/i);expect(html).not.toMatch(/<link[^>]+stylesheet/i);});
    it("provides accessible navigation and interactive product views",()=>{expect(html).toContain('aria-label="Main navigation"');expect(html).toContain('data-screen="studio"');expect(html).toContain('data-screen="dashboard"');expect(html).toContain('aria-expanded="false"');});
    it("presents the guided builder and professional runtime",()=>{for(const text of ["HyperPBI Builder","Guided Builder","Copy AI Prompt","Validate & Preview","Enterprise Light","Advanced ECharts","segmentedControl","smallMultiples"])expect(html).toContain(text);});
    it("shows linked product attribution in both visual entry screens",()=>{for(const source of [visualLanding,setupExperience]){expect(source).toContain("Designed, Developed and Maintained by H.Nguyen - WWO");expect(source).toContain("https://austinwin.github.io/hyperpbi");expect(source).toContain('target="_blank"');expect(source).toContain('rel="noreferrer"');}});
});
