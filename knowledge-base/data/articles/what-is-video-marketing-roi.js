'use strict';

module.exports = {
  metaTitle: `What is video marketing ROI? | VidaPulse`,
  metaDescription: `Video marketing ROI is the return a video produces versus the cost to make it and drive traffic to it. Learn what moves it and how to measure it on any video.`,
  answer: `Video marketing ROI is the return a video produces measured against everything you spent to produce it and to drive traffic to it. In plain terms: the revenue (or pipeline) a video drives, minus the cost of making it and getting views, divided by that cost. What moves it is not view count but how many viewers reach your offer and act, so retention and reach-to-offer are the real ROI levers, and you can measure all of it on a video hosted anywhere.`,
  sections: [
    {
      h2: `A plain definition of video marketing ROI`,
      html: `<p>Video marketing ROI is the return on what you invested in a video. The investment has two parts: the cost to produce the video, and the cost to drive traffic to it. The return is the revenue, or qualified pipeline, that the video drives. ROI is the return set against that total cost.</p>
<p>Put simply: take the revenue a video produces, subtract what it cost to make and to get views, and divide by that cost. A positive number means the video earns back more than it consumes; a negative number means it is a drain. The point of measuring it is to know which videos to keep, improve, or retire, and how hard to push traffic to each.</p>
<p>The common mistake is to judge a video by views or watch time. Those are inputs, not return. A video can rack up views and still have terrible ROI if almost no one reaches the offer or acts. ROI is the only number that ties the video back to money.</p>`,
    },
    {
      h2: `Why retention and reach-to-offer drive ROI`,
      html: `<p>Once ROI is defined as return over cost, it becomes clear what actually moves it. Production cost is mostly fixed once the video exists, and traffic cost is roughly fixed per view. The variable that swings return, and therefore ROI, is how many viewers reach your offer and act on it.</p>
<p>That is why retention and reach-to-offer are the real ROI levers. Revenue from a video follows a chain: plays, then the share who reach the offer, then the share who convert. Retention controls the middle of that chain. If most viewers leave before the pitch, you paid full production and traffic cost to reach people who never heard the ask, which crushes ROI no matter how many views you bought.</p>
<p class="kb-example">Hypothetical illustration, not VidaPulse data. Suppose a video costs 1,000 dollars to make and 1,000 dollars in traffic, and returns 2,000 dollars in sales, that is break-even ROI. Now suppose you fix the biggest pre-offer drop so twice as many viewers reach the offer, and return rises to 4,000 dollars on the same costs. ROI goes from zero to roughly 100 percent, with no extra spend. The lever was reach-to-offer, not budget.</p>`,
    },
    {
      h2: `How to measure it on a video hosted anywhere`,
      html: `<p>You do not need to re-host or rebuild your video to measure its ROI. You need three numbers, and they can come from a video that lives wherever it already is.</p>
<ol><li><strong>Cost.</strong> Add up production cost plus the traffic cost to drive views, from ads, email, or any source you pay for.</li>
<li><strong>Return.</strong> Track how many viewers act on the offer, by tying the call to action to conversions, so you can attribute revenue to the video.</li>
<li><strong>The ROI math.</strong> Return minus cost, divided by cost. Track it per video so you can compare them honestly.</li></ol>
<p>The piece most people lack is the return side, because they can see views and spend but cannot connect watching to a sale. Wrapping your existing video in an analytics player, with no re-hosting, gives you reach-to-offer and CTA conversions, which is exactly the data the return calculation needs. With that, ROI stops being a feeling and becomes a number you can compute on each video.</p>`,
    },
    {
      h2: `Use ROI to decide where to spend next`,
      html: `<p>The reason to measure video marketing ROI is to make better decisions with the next dollar. Once you can compute it per video, three moves open up.</p>
<ul class="kb-list"><li><strong>Scale the winners.</strong> A video with strong ROI can take more traffic, because each additional view returns more than it costs.</li>
<li><strong>Fix the leakers.</strong> A video with weak ROI driven by low reach-to-offer is a fix-first candidate; repair the biggest pre-offer drop before you spend more on traffic for it.</li>
<li><strong>Retire the losers.</strong> A video that cannot return its cost even with good traffic should not keep consuming budget.</li></ul>
<p>This is also why source attribution matters to ROI. When you can see which traffic sources lead to conversions, you can push spend toward the sources that lift return and away from those that only add cost. ROI, measured per video and per source, turns your video budget from a guess into a managed portfolio.</p>`,
    },
  ],
  solve: `<p>VidaPulse gives you the return side of the ROI equation without changing where your video lives. You paste your existing video URL from wherever it already is (YouTube, Amazon S3, Google Drive, Dropbox, OneDrive, Azure Blob, Loom, a Zoom recording, Vimeo, or a direct MP4 or HLS link), VidaPulse wraps it in an analytics player, and you embed it with one line of script or a script-free iframe. There is no re-hosting, so any video you already have can be measured for ROI.</p>
<p>From there, the numbers ROI needs are visible:</p>
<ul class="kb-list"><li>The <strong>percentage of viewers who reach any point</strong> shows reach-to-offer, the lever that most moves return per dollar of cost.</li>
<li>The <strong>audience-retention curve</strong> and <strong>second-by-second heatmap</strong> (Pro) show where viewers leave before the offer, so you can raise reach-to-offer and ROI.</li>
<li><strong>Conversion and CTA tracking</strong> (Pro) connects watching to action, giving you the return side of the calculation.</li>
<li><strong>Source and UTM attribution</strong> ties conversions to traffic sources, so you can compute ROI per source and shift spend toward what returns.</li></ul>
<p>No personal data is collected. To start, create a free VidaPulse account, wrap your own video, and measure its real ROI before you decide where the next dollar goes.</p>`,
  faq: [
    {
      q: `What is a simple definition of video marketing ROI?`,
      a: `It is the return a video produces measured against everything you spent on it. Take the revenue or pipeline the video drives, subtract the cost to produce it and to drive traffic to it, and divide by that cost. A positive number means the video earns back more than it consumes. Views and watch time are inputs, not return, so they do not measure ROI on their own.`,
    },
    {
      q: `What actually drives video marketing ROI?`,
      a: `How many viewers reach your offer and act on it. Production and traffic costs are roughly fixed, so the variable that swings return is reach-to-offer and conversion, which retention controls. If most viewers leave before the pitch, you paid full cost to reach people who never heard the ask, which crushes ROI no matter how many views you bought.`,
    },
    {
      q: `Can I measure ROI on a video I host on YouTube or S3?`,
      a: `Yes. You do not need to re-host the video to measure its ROI. Wrap your existing video URL in an analytics player, with no re-hosting, and you get reach-to-offer and CTA conversions, which is the return data the calculation needs. Combine that with your production and traffic costs and you can compute ROI per video wherever it lives.`,
    },
  ],
};
