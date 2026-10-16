# The learning questions

The same questions, with the same options, for everyone, so the answers can be counted and compared across squads. Claude asks them with clickable options (the `AskUserQuestion` tool): people pick one or more, or choose **Other** and type their own answer. Claude writes each answer into the person's log twice: as a code in the front matter (for counting) and in words below it.

Never reword a question or its options, and never change their order. If the clickable options aren't available, ask the same questions in chat as numbered options.

## At setup (`/start-here`): three questions, one call

| Key | Question | Pick | Options → code |
|---|---|---|---|
| `ai_use_before` | How much do you use AI tools in your work today? | One | Never or hardly ever → `1` · Now and then → `2` · Most weeks → `3` · Every day → `4` |
| `hopes` | What are you hoping to get from the hackathon? | One or more | See what Claude can do → `see-claude` · Build something real, fast → `build-fast` · Try work outside my usual job → `other-jobs` · Work with people I don't usually work with → `new-people` |
| `feeling` | How do you feel about using AI in your work? | One | Excited → `excited` · Curious → `curious` · Unsure → `unsure` · Sceptical → `sceptical` |

## At 19:00 (`/reflect`): four questions, one call

| Key | Question | Pick | Options → code |
|---|---|---|---|
| `worked_on` | What did you work on today? | One or more | Code or features → `code` · The design or the look → `design` · The words people see → `content` · Research or finding things out → `research` |
| `outside_usual_job` | How much of that was outside your usual job? | One | A lot → `a-lot` · A bit → `a-bit` · Not really → `not-really` · None of it → `none` |
| `got_in_way` | What got in the way? | One or more | Sharing or git → `sharing` · Claude getting things wrong → `claude-wrong` · Working as a squad (clashes, waiting) → `squad` · Not enough time → `time` |
| `ai_use_after` | How much would you use AI tools in your work now? | One | Same options and codes as `ai_use_before` |

## In the week after (`/reflect`): four questions, one call, then two in words

| Key | Question | Pick | Options → code |
|---|---|---|---|
| `specialist` | Did you still need a human specialist for anything? | One | Often → `often` · Sometimes → `sometimes` · Rarely → `rarely` · Never → `never` |
| `helped_squad` | What helped most when building as a squad? | One or more | The shared screen → `screen` · Claude explaining what it did → `explaining` · Small, frequent shares → `small-shares` · Talking it through first → `talking` |
| `idea_where` | Where could your idea to carry forward fit? | One or more | Internal work → `internal` · A bid → `bid` · My team → `my-team` · Client work where the tools are permitted → `client` |
| `ai_use_week_after` | How much do you expect to use AI tools in your work from now on? | One | Same options and codes as `ai_use_before` |

Then, in their own words: **the most useful thing you learned**, and **your one idea to carry forward** (plus, if `specialist` isn't `never`, what you needed one for).

## Coding Other

If someone picks **Other** and types an answer, write `other` as the code (inside the list for the "one or more" questions) and keep their exact words in the log.
