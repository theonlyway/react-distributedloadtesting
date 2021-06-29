resource "aws_vpc" "this" {
  cidr_block = var.vpc_cidr
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_eip" "this" {
  count = var.public_ips_for_slaves == false ? length(var.vpc_public_subnet_cidrs) : 0
  vpc   = true
}


resource "aws_subnet" "this_public" {
  count             = length(var.vpc_public_subnet_cidrs)
  vpc_id            = aws_vpc.this.id
  cidr_block        = var.vpc_public_subnet_cidrs[count.index]
  availability_zone = element(data.aws_availability_zones.available.names, count.index)
}

resource "aws_subnet" "this_private" {
  count             = length(var.vpc_private_subnet_cidrs)
  vpc_id            = aws_vpc.this.id
  cidr_block        = var.vpc_private_subnet_cidrs[count.index]
  availability_zone = element(data.aws_availability_zones.available.names, count.index)
}

resource "aws_nat_gateway" "this" {
  count         = var.public_ips_for_slaves == false ? length(var.vpc_public_subnet_cidrs) : 0
  allocation_id = aws_eip.this[count.index].id
  subnet_id     = aws_subnet.this_public[count.index].id
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

}

resource "aws_route_table" "this_public" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }
}

resource "aws_route_table" "this_private" {
  count  = var.public_ips_for_slaves == false ? length(var.vpc_public_subnet_cidrs) : 0
  vpc_id = aws_vpc.this.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.this[count.index].id
  }
}

resource "aws_route_table_association" "this_public" {
  count          = length(var.vpc_public_subnet_cidrs)
  subnet_id      = aws_subnet.this_public[count.index].id
  route_table_id = aws_route_table.this_public.id
}

resource "aws_route_table_association" "this_private" {
  count          = length(var.vpc_public_subnet_cidrs)
  subnet_id      = aws_subnet.this_private[count.index].id
  route_table_id = var.public_ips_for_slaves == false ? aws_route_table.this_private[count.index].id : aws_route_table.this_public.id
}
