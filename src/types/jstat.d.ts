declare module 'jstat' {
  interface JStat {
    fn: {
      twoSidedDifferenceOfProportions(p1: number, n1: number, p2: number, n2: number): number;
    };
    chisquare: {
      cdf(x: number, df: number): number;
    };
    normal: {
      inv(p: number, mean: number, std: number): number;
    };
  }
  
  const jStat: JStat;
  export default jStat;
}