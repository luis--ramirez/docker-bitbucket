<%@ page import="com.atlassian.johnson.Johnson" %>
<%@ page import="com.atlassian.johnson.JohnsonEventContainer" %>
<%@ page import="com.atlassian.johnson.event.Event" %>
<%@ page import="java.util.Collection" %>
<%@ page import="com.atlassian.bitbucket.Product" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=EDGE">
    <title><%= Product.FULL_NAME %> - Fatal Error</title>
    <style>
body {
    background-color: #F0F0F0;
    color: #666666;
    text-align: center;
    margin-top: 100px;
    font-family: sans-serif;
    font-size: 13px;
}
h1 {
    color: #333333;
}
.section {
    width: 900px;
    margin: 0 auto;
    background-color: #FFFFFF;
    box-shadow: 0 0 5px rgba(111, 111, 111, 0.15);
    border-radius: 4px;
    padding: 16px;
    text-align: left;
}
    </style>
</head>
<body>
<%
    final JohnsonEventContainer eventContainer = Johnson.getEventContainer(pageContext.getServletContext());
%>
<div class="section">
    <div class="header">
<%
    if (eventContainer.hasEvents()) {
%>
    <h1>A fatal error has occurred</h1>
    </div>
<%
    final Collection<Event> events = eventContainer.getEvents();
%>
    <p>The following problem<%= events.size() > 1 ? "s" : "" %> occurred, which prevents <%= Product.FULL_NAME %> from starting:</p>
    <ul>
    <% for (Event event : events) { %>
        <li><%= event.getDesc().replace("\n", "<br/>") %></li>
    <% } %>
    </ul>
<%
    } else {
%>
    <h1><%= Product.FULL_NAME %> is running fine.</h1>
    <p> There are no errors. <a href="<%= request.getContextPath()%>/">Go to <%= Product.NAME %></a></p>
<%
    }
%>
</div>
</body>
</html>
