---
layout: post
title:  "​​Comparing recommendation rankings"
date:   2020-02-09
thumbnail: recrank.png
math: true
tags: datascience hopper recommenders
---

<!-- source https://paper.dropbox.com/doc/Comparing-recommendation-rankings--B0iz_NfYGhosiRQNGZVLKE~HAg-MLxh9yVXVmE5Rq6Z0I5lq
-->
​​
Displaying ordered lists of product recommendations is ubiquitous in e-commerce. A good sort algorithm is particularly important in a mobile commerce setting like Hopper, where the screen is small and attention is short, and users are much more likely to interact with recommendations near the top of the list.   Even though product lists may contain hundreds of items, only the first five to ten items will generate material interaction.   How can we can account for these effects when we’re designing competing algorithms?
​​
![Sorted lists](/assets/img/recrank-list1.png){: width="300px" }

![Sorted lists](/assets/img/recrank-list3.png){: width="300px" }

![Sorted lists](/assets/img/recrank-list2.png){: width="300px" }
<div class=caption markdown=1>
​​Sorted lists of recommendations are ubiquitous in mobile commerce.
</div>

​​When building a ranking algorithm, we typically need to balance competing factors like price, quality, popularity and rating, and these tradeoffs can be different for different users.   Although it’s straightforward to run champion/challenger tests on potential algorithms and compare overall metrics, like “how many users converted in each variant?”, it’s not always easy to understand what drives those changes.
​​
> This article was written as part of our work at Hopper.  ​​Want to help our customers make smarter travel decisions?  [We're hiring!][hiring]

[hiring]: https://www.hopper.com/careers
​​
​​One approach is to ask how differently the algorithms rank the same source list.  A traditional approach to comparing two orderings of the same set of elements is something like the Kendall Tau distance.

![Rank comparison](/assets/img/recrank-wiki.png){: width="300px" }
<div class=caption markdown=1>
​​Wikipedia’s example compares the ordering of five people labeled <A, B, C, D, E> by height, with those same people ordered <C, D, A, B, E> by weight.  The Kendall Tau distance compares how many pairs swap order between rankings, like A & D, compared to pairs that maintain their order, like B & E.
</div>
​​
​​However, with something like a flight or hotel list on a mobile device, the user often won’t see many (most!) of the elements in the list, so changes farther down the list are much less important than changes near the top.  We need some kind of weighted comparison like the general-purpose weighted Kendall Tau implemented in SciPy where each pair of items gets a variable weight.  But what weights should we choose?
​​
​​Imagine a very simple model for list consumption based on the geometric distribution.  The user starts at the top and flips a coin to decide whether to consume the next item or abandon the list. Each time they consume an item, they repeat the process to decide whether to continue. In general, assume the coin is biased so they consume each item with probability ​​
�
p​.  That means the probability of consuming no elements is ​​
1
−
�
1−p​, the probability of consuming exactly one is ​​
�
(
1
−
�
)
p(1−p)​, and the probability of consuming exactly ​​
�
k​ items is ​​
�
�
(
1
−
�
)
p
​k
​​ (1−p)​.  It’s easy to see that the probability of consuming at least ​​
�
k​ items is just ​​
�
�
p
​k
​​ ​, so the chance of consuming fewer than ​​
�
k​ items is ​​
1
−
�
�
1−p
​k
​​ ​.   We can also calculate the expected number of consumed items as ​​
∑
�
�
�
(
1
−
�
)
=
�
/
(
1
−
�
)
∑kp
​k
​​ (1−p)=p/(1−p)​ and see that half of users consume fewer than ​​
log
1
2
/
log
�
log
​2
​
​1
​​ /logp​ items.
​​
​​Does this model pass the smell test?  Let’s look at some data for how Hopper users interact with hotels.  The left chart shows a log plot of how many searches end after scrolling to the ​​
�
k​-th item.  (We exclude cases where the user exhausted the list to avoid end effects.)  Our model suggests this chart should be a straight line with slope ​​
log
�
logp​.   The chart on the right shows how we can estimate ​​
�
p​ using the ratio of successive counts, which the model says should give a horizontal line.


![User searches](/assets/img/recrank-items.png){: width="300px" }


​​Number of user searches that consider ​​
�
k​ hotel recommendations before ending (log scale)

![View next item](/assets/img/recrank-marginal.png){: width="300px" }

​​Likelihood of considering one more recommendation after viewing ​​
�
k​ items.


​​Clearly users are more likely to abandon within the first few items - perhaps they quickly realize it’s the “wrong” list - and they become slightly more likely to continue deep into the list - perhaps mindless “flicking” ensues - but for the most part our model seems reasonable, with a best fit excluding the initial items of ​​
�
=
0
.
9
5
p=0.95​ (dotted).  Due to the high initial drop-off, more than half of users consider fewer than ten items compared to the ​​
log
0
.
5
/
log
0
.
9
5
≃
1
3
.
5
log0.5/log0.95≃13.5​ predicted by the simple model.
​​
​​Back to our question about choosing weights for comparing rankings.  Consider a pair of items in one of the lists with item ranks ​​
�
<
�
i<j​.  It seems reasonable to choose a weight based on how likely it is that the user actually sees the items in question.  According to our model, the user will see neither item with probability ​​
1
−
�
�
1−p
​i
​​ ​, both items with probability ​​
�
�
p
​j
​​ ​, or just ​​
�
i​ but not ​​
�
j​ with probability ​​
�
�
−
�
�
p
​i
​​ −p
​j
​​ ​ (since we assumed that ​​
�
i​ precedes ​​
�
j​).  That suggests a weight of ​​
�
�
�
=
0
⋅
(
1
−
�
�
)
+
1
⋅
(
�
�
−
�
�
)
+
2
⋅
�
�
=
�
�
+
�
�
w
​ij
​​ =0⋅(1−p
​i
​​ )+1⋅(p
​i
​​ −p
​j
​​ )+2⋅p
​j
​​ =p
​i
​​ +p
​j
​​ ​.   After summing over all pairs, we’re effectively just weighting item ​​
�
k​ by ​​
�
�
p
​k
​​ ​, the likelihood of consuming at least ​​
�
k​ items.  That means we can calculate the list similarity via:
​​
​​import numpy as np
​​from scipy.stats import weightedtau
​​# xs and ys are the competing permutations (rankings) of [0, 1, ..., n-1]
​​weightedtau(xs, ys, rank=False, weigher=lambda k: np.power(0.95, k), additive=True)
​​
​​The image below shows an example comparing a champion (left) and challenger (right) sort for an Orlando hotel search, where items are faded based on user interaction likelihood.   The champion features higher prices and discounts compared to the challenger’s lower prices with slightly lower discounts.  The weighted tau of 0.61 confirms the lists are quite similar (1 being exactly equal), and we can see visually that many of the top items are only slightly shuffled between the two lists.


![Visual comparison](/assets/img/recrank-viz.png){: width="300px" }

​​Visual comparison of a champion (left) and challenger (right) sort for a three night February Orlando hotel search, with a similarity score of ​​
�
=
0
.
6
1
τ=0.61​.    The first fifty items are shown for each sort (read right to left, top to bottom), with the nightly rate (US$), Hopper’s discount (purple), and an opacity of ​​
0
.
9
5
�
0.95
​k
​​ ​ indicating interaction likelihood.


​​The similarity score can be a useful diagnostic tool.  For example, if we compare the same champion and challenger algorithms across a number of markets (below) we see that similarity is a good predictor of performance - with a successful champion, most improvements will be found nearby, and rankings that are “too different” tend to hurt performance.

![Comparing rankings](/assets/img/recrank-comp.png){: width="300px" }
<div class=caption markdown=1>
​​Comparing champion and challenger hotel rankings across multiple large markets.  The x axis shows weighted ranking similarity (identical is 1, random is 0, -1 would be reversed) and the y axis shows relative purchase rate with challenger beating champion for positive values.  Most improvements occur when the challenger is not “too far” from the champion.
</div>

​​Just as geometric weighting is handy for visualizing interaction likelihood and comparing sort order, it can also be a useful tool for comparing other ranking quality metrics.   In general, if we have some metric ​​
�
�
x
​k
​​ ​ that’s defined for each item in our ranked list, we just form a weighted average with weights ​​
�
�
p
​k
​​ ​ so that ​​
�
¯
=
∑
�
�
�
�
/
∑
�
�
​x
​¯
​​ =∑p
​k
​​ x
​k
​​ /∑p
​k
​​ ​ to estimate the expected user exposure to the metric.   For example, with our hotel sort order we might compare weighted averages for features like nightly rate (or log nightly rate), discount (as percentage or boolean), or distance from city center to help us understand what factors are driving relative success.
​​
​​Hopefully this little detour into recommendation rankings has given you some food for thought. We’d love to hear your feedback.
​​
