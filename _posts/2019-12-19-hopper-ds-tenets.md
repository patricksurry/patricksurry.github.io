---
layout: post
title:  "Hopper’s data science DNA: the tenets we live by"
date:   2019-12-19
thumbnail: ds-tenets.png
tags: datascience hopper
---

At [Hopper][hopper], we’re busy building the world’s most customer-centric travel marketplace.
Traditionally, buying travel has been time-consuming, frustrating and often leaves the customer dissatisfied: feeling that they could have done better if only they’d worked harder.
By analyzing huge volumes of market pricing & demand data (trillions of records a month) and building personalized relationships with our users, we can increase transparency, reduce friction and make our customers happier.
In many ways, data is our product: it helps us find better deals, understand customer needs, more efficiently match supply & demand, and even create unique products that help our customers better navigate uncertainty and risk.

[hopper]: www.hopper.com

As such, data science will always be critical to Hopper’s success.
But what does it mean to be successful as a data scientist at Hopper?
Even the definition of “data science” is hard to pin down, with many jumping on the “data science” bandwagon after the HBR proclaimed it the [sexiest job of the 21st century][hbr].
As we grow our amazing team, we’ve done a lot of introspection to land on eight tenets that we believe are key to our success.
It might surprise you that we don’t mention things like technical skills, tools, algorithms or accuracy.
Although important, we don’t believe these are the key factors that drive the outcomes we seek.

[hbr]: https://hbr.org/2012/10/data-scientist-the-sexiest-job-of-the-21st-century

> [This article][original] was originally published in [Life at Hopper][lifeathopper] on Medium.
{: .prompt-info }

[original]: https://medium.com/life-at-hopper/hoppers-data-science-dna-the-tenets-that-define-our-team-83d88f8f1e3d
[lifeathopper]: https://medium.com/life-at-hopper/

Deliver Value
:   Our fundamental guiding principle is that we deliver value to you, the customer.
    This is all about practical business impact, with the ultimate metric being customer lifetime value:
    does our work make you more likely to buy from us and to keep coming back?
    For example, we know that customers value our price prediction and buy/wait recommendations because 95% of our bookers enable push notifications, and because users who watch, wait and save with us are more than twice as likely to become repeat bookers.
    Perhaps the ultimate proof in the early days was that users booked with Hopper despite the $5 booking fee we originally charged (we no longer do).
    Even though every flight we sold was available more cheaply elsewhere, our customers showed us that they valued the convenience and confidence they got by booking at the right time.

Earn Trust
:   To build that kind of lasting relationship, we must earn trust.
    We don’t monetize your data, bait and switch, hate sell,
    or otherwise make recommendations that are in our interest rather than yours;
    instead, we strive to become your trusted advisor and value that long-term relationship over short-term gain.
    Location data is a great example.
    To reduce friction, we offer to use your app’s location to suggest departure airports near you.
    Initially, we stored that location data with each user’s profile.
    But on reflection, we now discard it immediately after use,
    because we believe it’s creepy to essentially know which room of your house you’re in without offering some compelling benefit in exchange.
    Similarly, when we create unique derivative we value transparent solutions that secure the best price for the customer rather than opaque solutions designed to maximize Hopper’s cut.
    We designed our “price freeze” product with a deposit model: rather than charging a fee,
    we’ll guarantee today’s price if you make a small deposit which you can spend on whatever flight you end up booking.

Simplify
:   At its core, the role of data science at Hopper is to take complex data about pricing,
    demand and an effectively infinite set of alternative travel choices and simplify for our customers into just the key points and context.
    A seemingly trivial example from the mists of Hopper history involved our price predictions.
    In some early versions of our interface, we used the word “forecast” on the screen presenting our price recommendations.
    But during user testing, we saw that this confused some users who associated that term with weather prediction!
    One of the biggest challenges at Hopper is not in building the algorithm itself, but in communicating the results to the user in an effective and actionable way without being confusing or overwhelming.
    Simple isn’t always obvious or easy.

Ask Good Questions
:   It feels like everywhere we look in the travel marketplace we see inefficiency and opportunity,
    making it critical for us to make smart decisions about what we work on,
    and what trade-offs we make.
    This boils down to asking good questions, by thinking deeply about what the customer really needs, and making sure that we measure and optimize the right things.
    What might initially seem like a “dumb question” often reveals new insights or weak assumptions.
    Recently we worked hard to improve conversion rates by offering a “guest checkout” feature where you didn’t have to create a full profile before booking a flight.
    This succeeded in increasing bookings, but after careful analysis, it was clear that it actually lowered repeat rates.
    Customers were less invested and less likely to buy from us again, and ultimately we decided not to roll out the feature.

Find A Way
:   Navigating in such a rapidly changing,
    messy and uncertain landscape often makes it difficult to see the right path forward.
    But we find a way to get to a disciplined “yes” to the customer need.
    Sometimes that involves negotiating to a better question,
    and almost always needs careful listening and questioning.
    Our goal is always to unblock the customer as fast as possible.
    There’s no better inspiration for this tenet than the original moon shot,
    explored in this compelling [BBC podcast][13minutes].

[13minutes]: https://www.bbc.co.uk/programmes/w13xttx2

Ship It
:   It’s easy to feel lost in a maze of imperfect data and untested assumptions,
    and the scientist in us is always tempted to pull in a bit more data or build one more model.
    But that can quickly devolve into local optimization for the wrong outcome.
    Because the customer is the ultimate arbiter, we need to ship it so we can iterate quickly and accelerate innovation.
    We consider ourselves pathfinders who think big and seek high rewards by taking risks that others avoid.
    New features often start with “product-free” experiments:
    like when we began manually offering some bookers cancellation insurance via a notification leading to a simple HTML landing page.
    This sometimes (often?!) generates a tension between speed and quality,
    and between data science and engineering, but we consider that a healthy state of affairs.

Embrace Failure
:   Rapid experimentation and exploration leads to many dead ends,
    so we must learn to embrace failure.
    Failure is a positive outcome if we learn from it,
    but it’s worth remembering that the path to success looks much more like punctuated equilibria than one of continuous improvement.
    For example, many of us feel that Hopper is well-placed to solve the “flexible search” use case for lower intent users who haven’t yet figured out exactly where or when they want to travel,
    but multiple attempts to date have failed to demonstrate real value.
    Is it a quixotic quest or have we just missed the right line of attack?

Take Ownership
:   Last but not least, we take ownership of all the work we do.
    We often work as part of multidisciplinary teams with our partners in product, design, engineering, growth, operations and supply.
    For projects like [price freeze][pricefreeze] where the data science is central to success or failure,
    data science actually owns and runs the P&L, but even when another function is making those calls, we’re always responsible for the accuracy, quality, and impact of using our work.
    In contrast to “caveat emptor,” our promise is that a warranty is implied: it’s a lifetime guarantee.

[pricefreeze]: https://hopper.com/product/price-freeze