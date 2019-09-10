# The Sustainability Cooperative's Website

## Introduction

### Overview

This repository contains the code for the Sustainability Cooperative's website.
The repository is split into two parts: the `frontend` and the `backend`. The
frontend is the client side (the webpages the users actually see), while the
backend is the API layer the frontend uses to get data.

### Frontend Stack

The client side is entirely static. We use a tool developed in-house called `architekt`
for rendering Handlebars into static files. The frontend uses a primitive version of
architekt, which can be found in `packages/frontend/bin/render.js`. For styling,
we use SASS.

### Backend Stack

The backend uses the Express server framework for handling HTTP requests. Currently,
there is no database as we don't need to store a lot of data right now. Instead,
