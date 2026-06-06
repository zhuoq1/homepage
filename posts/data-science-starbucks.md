# What I Learned About Data Science at Starbucks Japan

When people think of data science, they often picture recommendation algorithms at tech companies or large language models trained on GPU clusters. But some of the most impactful data science happens in much more grounded settings — like predicting how many matcha lattes a Shibuya Starbucks will sell next Tuesday at 8 AM.

Here's what I've learned after more than a year as a Data Scientist at Starbucks Japan.

## Lesson 1: The Data Is Messier Than You Expect

In Kaggle competitions, you get a clean CSV. In retail, data comes from POS systems, loyalty apps, weather APIs, and manually-maintained store metadata spread across three departments. Before you can do any modeling, you need to build reliable data pipelines.

A significant portion of my time — maybe 40% — goes into data engineering: joining disparate sources, handling missing values, validating data freshness, and building monitoring to catch pipeline failures before they affect downstream models.

## Lesson 2: Forecast Accuracy Is a Product Feature

Demand forecasting is the backbone of retail operations. If you over-forecast, you waste inventory and labor. If you under-forecast, you run out of product and disappoint customers.

Some things I've learned about forecasting in practice:

- **Seasonality is everything.** Japanese retail has strong weekly patterns (weekday vs. weekend), monthly patterns (payday effects), and annual patterns (holidays like Golden Week and Obon completely change behavior).
- **Weather matters more than you think.** A rainy day in Tokyo can shift demand by 15-20% as office workers stay near their buildings instead of venturing out.
- **Promotions have non-linear effects.** A 10% discount doesn't mean 10% more sales. The relationship depends on the product, the channel, and what competitors are doing.
- **Simple models often win.** We've tried everything from ARIMA to gradient boosting to deep learning. For many SKU-store combinations, a well-tuned LightGBM with good features beats more complex approaches — and is easier to explain to store managers.

## Lesson 3: Japanese Consumers Are Different

Working in Japan means adapting to local consumer behavior:

- **Seasonal limited editions drive massive spikes.** The sakura (cherry blossom) season drinks create demand patterns you don't see in any textbook.
- **Convenience store competition is fierce.** Japanese convenience stores (konbini) sell surprisingly good coffee at half the price. Understanding the competitive landscape is part of the job.
- **Loyalty program engagement is high.** Starbucks Rewards penetration in Japan is among the highest globally, giving us rich first-party data — but also high expectations for personalization.

## Lesson 4: Stakeholder Communication Is the Real Job

The most accurate model in the world is useless if nobody trusts it. Building trust means:

- Explaining predictions in terms the business understands (yen, not RMSE)
- Showing your work — model cards, feature importance plots, backtest results
- Admitting uncertainty — "we expect 200-240 units" is more honest and useful than "237 units"
- Learning from domain experts — store managers often know things your model doesn't (a nearby construction project, a local festival)

## Wrapping Up

Data science in retail isn't glamorous in the way that training frontier AI models is. But it's deeply satisfying to see your work have a direct, measurable impact — shelves stocked correctly, customers getting their favorite drink, less food waste at the end of the day. If you're considering a data science role outside of big tech, I highly recommend it.
