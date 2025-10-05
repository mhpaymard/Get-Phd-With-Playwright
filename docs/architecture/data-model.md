# Data Model Design

## Entities

### Discipline
- id (uuid/string)
- token (string, starts ^10)
- name
- slug
- version (int)
- created_at / updated_at

### Subject
- id
- token (^30)
- name
- slug
- discipline_id (fk)
- version
- created_at / updated_at

### Geo
- id
- token (^g)
- name
- slug
- level (country|region|city?)
- parent_id (nullable)
- version
- created_at / updated_at

### FundingOption
- id
- token (^01)
- label
- category (eligibility|funding)
- version
- created_at / updated_at

### Institution
- id
- external_ref (e.g. IID param if discovered)
- name
- country_id (fk geo)
- homepage_url
- discovered_at
- updated_at

### Project
- id (hash of canonical URL or incremental)
- url
- title
- institution_id (nullable)
- discipline_id (nullable)
- subject_id (nullable)
- geo_id (nullable)
- funding_flags (string[])
- deadlines (JSONB: { postedAt?, applyBy? })
- attributes (JSONB – extra extracted signals)
- first_seen_at / last_seen_at
- updated_at

### ProjectSnapshot
- id
- project_id (fk)
- fetched_at
- listing_url (the search URL used)
- raw_html (text / compressed)
- parsed (JSONB: normalized fields)
- parser_version

### TokenDictionaryVersion
- id
- version (int)
- created_at
- diff (JSONB)
- full (JSONB minimal subset) 

### SearchRequest
- id
- user_id
- filters (JSONB – normalized request)
- canonical_key
- status (pending|complete|error|partial)
- result_count (int nullable)
- cache_hit (bool)
- created_at / completed_at

### RateUsage
- user_id
- window_start (timestamp)
- count
- window_size_seconds

## Relationships
- subject.discipline_id → discipline.id
- project.discipline_id/subject_id/geo_id → respective tables
- project_snapshot.project_id → project.id
- institution.country_id → geo.id

## Indexing Strategy
- UNIQUE(project.url)
- project(last_seen_at) for pruning
- GIN(project.attributes) / GIN(project.funding_flags)
- project_snapshot(project_id, fetched_at DESC)
- search_request(user_id, created_at DESC)
- token_dictionary_version(version UNIQUE)

## Normalization vs Denormalization
- Projects store foreign keys; queries that need joined metadata can pre-join into a materialized view for popular filters.
- Funding flags left inline (array) for rapid containment queries.

## Retention
- Snapshots: keep last N (e.g. 3) per project, archive older to cold storage.
- Deleted / disappeared projects: if not seen in X days, mark inactive.

## Migration Considerations
- Start with minimal: Discipline, Geo, FundingOption, Project, Snapshot
- Add Subject, Institution once discovery stable.

