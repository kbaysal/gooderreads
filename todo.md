# GooderReads
Long term:
   - [x] Login 
       - [x] Might wanna build a /signin flow
   - [ ] Labeling window
       - [x] Release date
            - [ ] Introduce smarter logic so that newer GAPI can overwrite the user overwrite
       - [x] Optional
       - [x] Reviewed
  - [ ] Todo list
       - [x] Improve title
       - [x] Show labels
       - [ ] Allow labels to be removed
       - [x] Filter by to read/to review/all
       - [x] Collapsible lists
   - [ ] Use the bookinfo table for populating book info
   - [x] New views with filters
       - [ ] Finish list creation/editing screen 
   - [x] Move search to its own thing so that it can be on all pages
   - [ ] Graphs


bookdates = [];
$0.children.forEach((i) => {
    const id = i.getAttribute("id");
    console.log(id);
    const title = i.getElementsByTagName("a")[1].innerHTML;
    console.log(title);
    const date = i.getElementsByClassName("d-md-table-cell")[0].innerHTML.trim();
    bookdates.push({id, title, date});
})
bookdates = bookdates.sort((a, b) => new Date(a.date) - new Date(b.date))
orderList = bookdates.map((b) => b.id).join(",")